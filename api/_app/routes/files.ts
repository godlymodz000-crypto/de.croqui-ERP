import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import {
  deletionRequests,
  projectFiles,
  projectNotes,
  projects,
  users,
  type DeletionRequest,
  type ProjectFile,
  type ProjectNote,
  type Subfolder,
} from '../db/schema.js';
import { audit } from '../audit.js';
import { projectDtos } from './projects.js';
import { fileViewUrl, projectSubfolderId, type DriveClient } from '../drive.js';
import { closePending, noticeDecision, noticeNewRequest } from '../notifications-service.js';
import { signGrant, verifyGrant, UPLOAD_GRANT_TTL_MS, type UploadGrant } from '../upload-token.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_NAME = 200;
const MAX_FILE_SIZE = 2 * 1024 ** 3;
const MAX_NOTE = 5000;
const MAX_REASON = 500;
/** Lado maior da imagem grande servida pelo ERP. */
const IMAGE_SIZE = 1600;
/** Sem imagem gerada pelo Drive, o original só passa pelo servidor se couber na resposta da Vercel (cerca de 4,5 MB). */
const MAX_IMAGE_PASSTHROUGH = 4 * 1024 * 1024;

/** Pelo upload da tela do projeto: Fotos, Contratos ou Arquivos (qualquer tipo, como CAD e SketchUp). A raiz do projeto não é opção. */
const UPLOAD_SUBFOLDERS: Subfolder[] = ['photos', 'contracts', 'files'];
const EXPORT_KINDS = { budget: { subfolder: 'budgets', label: 'Orçamento' }, presentation: { subfolder: 'presentations', label: 'Apresentação' } } as const;

type ItemType = DeletionRequest['itemType'];
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

interface Deps {
  db: Db;
  drive: DriveClient;
  sessionSecret: string;
  /** Endereço do ERP no navegador, liberado no CORS da sessão de upload. */
  appOrigin: string;
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

function driveFailed(request: FastifyRequest, reply: FastifyReply, err: unknown) {
  request.log.error({ err: (err as Error)?.message ?? err }, 'falha no Google Drive');
  return reply.code(502).send({ error: 'drive_failed' });
}

/** "01-11-2026", no fuso do estúdio. */
function exportDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}-${get('month')}-${get('year')}`;
}

export async function filesRoutes(app: FastifyInstance, { db, drive, sessionSecret, appOrigin }: Deps) {
  async function activeProject(id: string) {
    if (!UUID_RE.test(id)) return undefined;
    const [p] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return p;
  }

  async function userNames(ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((x): x is string => !!x))];
    if (!unique.length) return new Map<string, string>();
    const rows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, unique));
    return new Map(rows.map((u) => [u.id, u.name ?? u.email]));
  }

  async function pendingItems(type: ItemType, ids: string[]) {
    if (!ids.length) return new Set<string>();
    const rows = await db
      .select({ itemId: deletionRequests.itemId })
      .from(deletionRequests)
      .where(and(eq(deletionRequests.itemType, type), eq(deletionRequests.status, 'pending'), inArray(deletionRequests.itemId, ids)));
    return new Set(rows.map((r) => r.itemId));
  }

  async function fileDtos(rows: ProjectFile[]) {
    const names = await userNames(rows.map((f) => f.uploadedBy));
    const pending = await pendingItems('file', rows.map((f) => f.id));
    return rows.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      subfolder: f.subfolder,
      source: f.source,
      createdAt: f.createdAt,
      uploadedBy: f.uploadedBy ? (names.get(f.uploadedBy) ?? null) : null,
      driveFileId: f.driveFileId,
      driveUrl: fileViewUrl(f.driveFileId),
      hasThumbnail: f.mimeType.startsWith('image/'),
      pendingDeletion: pending.has(f.id),
    }));
  }

  async function noteDtos(rows: ProjectNote[]) {
    const names = await userNames(rows.map((n) => n.authorUserId));
    const pending = await pendingItems('note', rows.map((n) => n.id));
    return rows.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      author: n.authorUserId ? (names.get(n.authorUserId) ?? null) : null,
      pendingDeletion: pending.has(n.id),
    }));
  }

  // ---------- Arquivos ----------

  app.get<{ Params: { id: string } }>('/projects/:id/files', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    const project = await activeProject(request.params.id);
    if (!project) return reply.code(404).send({ error: 'not_found' });
    const rows = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.projectId, project.id), isNull(projectFiles.deletedAt)))
      .orderBy(desc(projectFiles.createdAt));
    return fileDtos(rows);
  });

  app.get<{ Params: { id: string } }>('/files/:id/thumbnail', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.code(404).send({ error: 'not_found' });
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.id, request.params.id), isNull(projectFiles.deletedAt)));
    if (!file) return reply.code(404).send({ error: 'not_found' });
    const thumb = await drive.thumbnail(file.driveFileId).catch(() => null);
    if (!thumb) return reply.code(404).send({ error: 'no_thumbnail' });
    return reply.header('content-type', thumb.contentType).header('cache-control', 'private, max-age=3600').send(Buffer.from(thumb.body));
  });

  /** Imagem grande pelo servidor do ERP, sem depender da pré-visualização do Drive nem do login Google no navegador. */
  app.get<{ Params: { id: string } }>('/files/:id/image', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.code(404).send({ error: 'not_found' });
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.id, request.params.id), isNull(projectFiles.deletedAt)));
    if (!file || !file.mimeType.startsWith('image/')) return reply.code(404).send({ error: 'not_found' });
    const image =
      (await drive.thumbnail(file.driveFileId, IMAGE_SIZE).catch(() => null)) ??
      (await drive.download(file.driveFileId, MAX_IMAGE_PASSTHROUGH).catch(() => null));
    if (!image) return reply.code(404).send({ error: 'no_image' });
    return reply.header('content-type', image.contentType).header('cache-control', 'private, max-age=3600').send(Buffer.from(image.body));
  });

  /** Abre a sessão no Drive e devolve o endereço de envio com a autorização assinada. */
  async function openSession(
    request: FastifyRequest,
    reply: FastifyReply,
    projectId: string,
    input: { name: string; mimeType: string; size: number; subfolder: Subfolder; source: UploadGrant['source'] },
  ) {
    const project = await activeProject(projectId);
    if (!project) return reply.code(404).send({ error: 'not_found' });
    let folderId: string;
    let uploadUrl: string;
    try {
      folderId = await projectSubfolderId(drive, project.driveFolderId, input.subfolder);
      uploadUrl = await drive.createUploadSession({ name: input.name, mimeType: input.mimeType, size: input.size, parentId: folderId, origin: appOrigin });
    } catch (err) {
      return driveFailed(request, reply, err);
    }
    const grant: UploadGrant = { ...input, projectId: project.id, folderId, userId: request.user!.id, expiresAt: Date.now() + UPLOAD_GRANT_TTL_MS };
    return reply.code(201).send({ uploadUrl, token: signGrant(grant, sessionSecret), name: input.name });
  }

  function validFile(body: { name?: unknown; mimeType?: unknown; size?: unknown }) {
    const fields: Record<string, string> = {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.trim() ? body.mimeType.trim() : 'application/octet-stream';
    const size = typeof body.size === 'number' && Number.isInteger(body.size) ? body.size : -1;
    if (!name) fields.name = 'required';
    else if (name.length > MAX_FILE_NAME || /[\\/]/.test(name)) fields.name = 'invalid';
    if (size <= 0) fields.size = 'invalid';
    else if (size > MAX_FILE_SIZE) fields.size = 'too_large';
    return { fields, name, mimeType, size };
  }

  app.post<{ Params: { id: string }; Body: { name?: unknown; mimeType?: unknown; size?: unknown; subfolder?: unknown } }>(
    '/projects/:id/uploads',
    { config: { permission: 'content.write' } },
    async (request, reply) => {
      const body = request.body ?? {};
      const { fields, name, mimeType, size } = validFile(body);
      const subfolder = body.subfolder as Subfolder;
      if (!UPLOAD_SUBFOLDERS.includes(subfolder)) fields.subfolder = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });
      return openSession(request, reply, request.params.id, { name, mimeType, size, subfolder, source: 'upload' });
    },
  );

  /** PDF exportado no editor: o servidor dá o nome "<Tipo> - <Projeto> - <data>.pdf" e escolhe a subpasta. */
  app.post<{ Params: { id: string }; Body: { kind?: unknown; size?: unknown } }>(
    '/projects/:id/exports',
    { config: { permission: 'documents.export' } },
    async (request, reply) => {
      const body = request.body ?? {};
      const kind = EXPORT_KINDS[body.kind as keyof typeof EXPORT_KINDS];
      const size = typeof body.size === 'number' && Number.isInteger(body.size) ? body.size : -1;
      const fields: Record<string, string> = {};
      if (!kind) fields.kind = 'invalid';
      if (size <= 0 || size > MAX_FILE_SIZE) fields.size = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });
      const project = await activeProject(request.params.id);
      if (!project) return reply.code(404).send({ error: 'not_found' });
      const name = `${kind.label} - ${project.name} - ${exportDate(new Date())}.pdf`;
      return openSession(request, reply, project.id, { name, mimeType: 'application/pdf', size, subfolder: kind.subfolder, source: 'pdf_export' });
    },
  );

  /**
   * O navegador terminou de enviar ao Drive: o servidor confere o arquivo no Drive contra a autorização
   * e só então grava o registro. Arquivo que não confere vai para a lixeira e nada é gravado.
   */
  async function complete(request: FastifyRequest<{ Params: { id: string }; Body: { token?: unknown; driveFileId?: unknown } }>, reply: FastifyReply, source: UploadGrant['source']) {
    const grant = verifyGrant(request.body?.token, sessionSecret);
    const driveFileId = request.body?.driveFileId;
    if (!grant || grant.source !== source || grant.projectId !== request.params.id || grant.userId !== request.user!.id) {
      return reply.code(400).send({ error: 'invalid_upload' });
    }
    if (typeof driveFileId !== 'string' || !/^[\w-]{1,200}$/.test(driveFileId)) return reply.code(400).send({ error: 'invalid_upload' });
    const project = await activeProject(grant.projectId);
    if (!project) return reply.code(404).send({ error: 'not_found' });

    let file;
    try {
      file = await drive.getFile(driveFileId);
    } catch (err) {
      return driveFailed(request, reply, err);
    }
    const inFolder = !!file && file.parents.includes(grant.folderId);
    if (!file || file.trashed || !inFolder || file.name !== grant.name || file.size !== grant.size) {
      // Só mexe no que está na pasta autorizada; um ID de fora nunca é tocado.
      if (file && inFolder && !file.trashed) await drive.trashFile(file.id).catch(() => {});
      return reply.code(409).send({ error: 'upload_mismatch' });
    }

    const actor = request.user!;
    try {
      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(projectFiles)
          .values({
            projectId: project.id,
            driveFileId: file.id,
            name: file.name,
            mimeType: file.mimeType || grant.mimeType,
            sizeBytes: file.size,
            subfolder: grant.subfolder,
            source,
            uploadedBy: actor.id,
          })
          .returning();
        await audit(tx, {
          userId: actor.id,
          action: source === 'pdf_export' ? 'file.export' : 'file.upload',
          entity: 'file',
          entityId: row.id,
          payload: { projectId: project.id, name: row.name, sizeBytes: row.sizeBytes, subfolder: row.subfolder, driveFileId: row.driveFileId },
        });
        return row;
      });
      const [dto] = await fileDtos([created]);
      return reply.code(201).send(dto);
    } catch (err) {
      if (isUniqueViolation(err)) return reply.code(409).send({ error: 'already_registered' });
      throw err;
    }
  }

  app.post<{ Params: { id: string }; Body: { token?: unknown; driveFileId?: unknown } }>(
    '/projects/:id/uploads/complete',
    { config: { permission: 'content.write' } },
    (request, reply) => complete(request, reply, 'upload'),
  );

  app.post<{ Params: { id: string }; Body: { token?: unknown; driveFileId?: unknown } }>(
    '/projects/:id/exports/complete',
    { config: { permission: 'documents.export' } },
    (request, reply) => complete(request, reply, 'pdf_export'),
  );

  /** Exclusão direta (administrador): o arquivo vai para a lixeira do Drive e o registro é marcado. */
  async function deleteFile(file: ProjectFile, actorId: string, request: FastifyRequest, reply: FastifyReply, viaRequest?: DeletionRequest) {
    try {
      await drive.trashFile(file.driveFileId);
    } catch (err) {
      return driveFailed(request, reply, err);
    }
    await db.transaction(async (tx) => {
      await tx.update(projectFiles).set({ deletedAt: sql`now()` }).where(eq(projectFiles.id, file.id));
      if (viaRequest) await decide(tx, viaRequest, 'approved', actorId);
      else await closePending(tx, 'file', file.id, actorId);
      await audit(tx, {
        userId: actorId,
        action: 'file.delete',
        entity: 'file',
        entityId: file.id,
        payload: { projectId: file.projectId, name: file.name, driveFileId: file.driveFileId, trashedInDrive: true, requestId: viaRequest?.id ?? null },
      });
    });
    return null;
  }

  app.delete<{ Params: { id: string } }>('/files/:id', { config: { permission: 'content.delete' } }, async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.code(404).send({ error: 'not_found' });
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.id, request.params.id), isNull(projectFiles.deletedAt)));
    if (!file) return reply.code(404).send({ error: 'not_found' });
    const failed = await deleteFile(file, request.user!.id, request, reply);
    return failed ?? reply.code(204).send();
  });

  // ---------- Notas ----------

  /** Tela do projeto numa leitura só: projeto, arquivos e notas, com uma checagem do projeto. Mesma permissão das três rotas. */
  app.get<{ Params: { id: string } }>('/projects/:id/page', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    const project = await activeProject(request.params.id);
    if (!project) return reply.code(404).send({ error: 'not_found' });
    const [dto] = await projectDtos(db, [project]);
    const fileRows = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.projectId, project.id), isNull(projectFiles.deletedAt)))
      .orderBy(desc(projectFiles.createdAt));
    const noteRows = await db
      .select()
      .from(projectNotes)
      .where(and(eq(projectNotes.projectId, project.id), isNull(projectNotes.deletedAt)))
      .orderBy(desc(projectNotes.createdAt));
    return { project: dto, files: await fileDtos(fileRows), notes: await noteDtos(noteRows) };
  });

  app.get<{ Params: { id: string } }>('/projects/:id/notes', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    const project = await activeProject(request.params.id);
    if (!project) return reply.code(404).send({ error: 'not_found' });
    const rows = await db
      .select()
      .from(projectNotes)
      .where(and(eq(projectNotes.projectId, project.id), isNull(projectNotes.deletedAt)))
      .orderBy(desc(projectNotes.createdAt));
    return noteDtos(rows);
  });

  app.post<{ Params: { id: string }; Body: { body?: unknown } }>(
    '/projects/:id/notes',
    { config: { permission: 'content.write' } },
    async (request, reply) => {
      const body = typeof request.body?.body === 'string' ? request.body.body.trim() : '';
      if (!body) return reply.code(400).send({ error: 'validation', fields: { body: 'required' } });
      if (body.length > MAX_NOTE) return reply.code(400).send({ error: 'validation', fields: { body: 'too_long' } });
      const project = await activeProject(request.params.id);
      if (!project) return reply.code(404).send({ error: 'not_found' });
      const actor = request.user!;
      const note = await db.transaction(async (tx) => {
        const [n] = await tx.insert(projectNotes).values({ projectId: project.id, body, authorUserId: actor.id }).returning();
        await audit(tx, { userId: actor.id, action: 'note.create', entity: 'note', entityId: n.id, payload: { projectId: project.id, body } });
        return n;
      });
      const [dto] = await noteDtos([note]);
      return reply.code(201).send(dto);
    },
  );

  async function deleteNote(tx: Tx, note: ProjectNote, actorId: string, viaRequest?: DeletionRequest) {
    await tx.update(projectNotes).set({ deletedAt: sql`now()` }).where(eq(projectNotes.id, note.id));
    if (viaRequest) await decide(tx, viaRequest, 'approved', actorId);
    else await closePending(tx, 'note', note.id, actorId);
    await audit(tx, {
      userId: actorId,
      action: 'note.delete',
      entity: 'note',
      entityId: note.id,
      payload: { projectId: note.projectId, body: note.body, requestId: viaRequest?.id ?? null },
    });
  }

  app.delete<{ Params: { id: string } }>('/notes/:id', { config: { permission: 'content.delete' } }, async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.code(404).send({ error: 'not_found' });
    const [note] = await db
      .select()
      .from(projectNotes)
      .where(and(eq(projectNotes.id, request.params.id), isNull(projectNotes.deletedAt)));
    if (!note) return reply.code(404).send({ error: 'not_found' });
    await db.transaction((tx) => deleteNote(tx, note, request.user!.id));
    return reply.code(204).send();
  });

  // ---------- Pedidos de exclusão ----------

  /** O item ainda existe? Devolve o projeto dele, um rótulo e um detalhe para a tela de pedidos. */
  async function findItem(type: ItemType, id: string) {
    if (!UUID_RE.test(id)) return null;
    if (type === 'file') {
      const [f] = await db.select().from(projectFiles).where(eq(projectFiles.id, id));
      return f ? { projectId: f.projectId, deleted: !!f.deletedAt, label: f.name, detail: f.subfolder as string, file: f } : null;
    }
    if (type === 'note') {
      const [n] = await db.select().from(projectNotes).where(eq(projectNotes.id, id));
      return n ? { projectId: n.projectId, deleted: !!n.deletedAt, label: n.body, detail: n.createdAt.toISOString(), note: n } : null;
    }
    const [p] = await db.select().from(projects).where(eq(projects.id, id));
    return p ? { projectId: p.id, deleted: !!p.deletedAt, label: p.name, detail: p.clientName, project: p } : null;
  }

  async function decide(tx: Tx, req: DeletionRequest, status: 'approved' | 'rejected', actorId: string) {
    await tx.update(deletionRequests).set({ status, decidedBy: actorId, decidedAt: new Date() }).where(eq(deletionRequests.id, req.id));
    await audit(tx, {
      userId: actorId,
      action: status === 'approved' ? 'deletion.approve' : 'deletion.reject',
      entity: 'deletion_request',
      entityId: req.id,
      payload: { itemType: req.itemType, itemId: req.itemId, projectId: req.projectId, requestedBy: req.requestedBy },
    });
    await noticeDecision(tx, req, status, actorId);
  }

  app.post<{ Body: { itemType?: unknown; itemId?: unknown; reason?: unknown } }>(
    '/deletion-requests',
    { config: { permission: 'deletion.request' } },
    async (request, reply) => {
      const body = request.body ?? {};
      const itemType = body.itemType as ItemType;
      const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
      const fields: Record<string, string> = {};
      if (!['file', 'note', 'project'].includes(itemType)) fields.itemType = 'invalid';
      if (typeof body.itemId !== 'string') fields.itemId = 'invalid';
      if (reason.length > MAX_REASON) fields.reason = 'too_long';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      const item = await findItem(itemType, body.itemId as string);
      if (!item || item.deleted) return reply.code(404).send({ error: 'not_found' });
      const [parent] = await db.select({ deletedAt: projects.deletedAt }).from(projects).where(eq(projects.id, item.projectId));
      if (!parent || parent.deletedAt) return reply.code(404).send({ error: 'not_found' });

      const actor = request.user!;
      try {
        const created = await db.transaction(async (tx) => {
          const [pending] = await tx
            .select({ id: deletionRequests.id })
            .from(deletionRequests)
            .where(and(eq(deletionRequests.itemType, itemType), eq(deletionRequests.itemId, body.itemId as string), eq(deletionRequests.status, 'pending')));
          if (pending) return null;
          const [r] = await tx
            .insert(deletionRequests)
            .values({ itemType, itemId: body.itemId as string, projectId: item.projectId, reason: reason || null, requestedBy: actor.id })
            .returning();
          await audit(tx, {
            userId: actor.id,
            action: 'deletion.request',
            entity: 'deletion_request',
            entityId: r.id,
            payload: { itemType, itemId: r.itemId, projectId: r.projectId, reason: r.reason },
          });
          await noticeNewRequest(tx, r);
          return r;
        });
        if (!created) return reply.code(409).send({ error: 'already_pending' });
        return reply.code(201).send({ id: created.id, status: created.status });
      } catch (err) {
        if (isUniqueViolation(err)) return reply.code(409).send({ error: 'already_pending' });
        throw err;
      }
    },
  );

  app.get<{ Querystring: { status?: string } }>('/deletion-requests', { config: { permission: 'deletion.decide' } }, async (request) => {
    const status = (['pending', 'approved', 'rejected'] as const).find((s) => s === request.query.status) ?? 'pending';
    const rows = await db.select().from(deletionRequests).where(eq(deletionRequests.status, status)).orderBy(desc(deletionRequests.createdAt));
    const countRows = await db
      .select({ status: deletionRequests.status, n: sql<number>`count(*)::int` })
      .from(deletionRequests)
      .groupBy(deletionRequests.status);
    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const c of countRows) counts[c.status] = Number(c.n);

    const names = await userNames(rows.flatMap((r) => [r.requestedBy, r.decidedBy]));
    const projectRows = rows.length
      ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, [...new Set(rows.map((r) => r.projectId))]))
      : [];
    const projectName = new Map(projectRows.map((p) => [p.id, p.name]));
    const requests = await Promise.all(
      rows.map(async (r) => {
        const item = await findItem(r.itemType, r.itemId);
        return {
          id: r.id,
          itemType: r.itemType,
          itemId: r.itemId,
          itemLabel: item?.label ?? null,
          itemDetail: item?.detail ?? null,
          itemDeleted: !item || item.deleted,
          project: { id: r.projectId, name: projectName.get(r.projectId) ?? null },
          reason: r.reason,
          requestedBy: r.requestedBy ? (names.get(r.requestedBy) ?? null) : null,
          requestedById: r.requestedBy,
          status: r.status,
          decidedBy: r.decidedBy ? (names.get(r.decidedBy) ?? null) : null,
          decidedAt: r.decidedAt,
          createdAt: r.createdAt,
        };
      }),
    );
    return { requests, counts };
  });

  async function loadPending(id: string, actorId: string, reply: FastifyReply) {
    if (!UUID_RE.test(id)) return reply.code(404).send({ error: 'not_found' });
    const [req] = await db.select().from(deletionRequests).where(eq(deletionRequests.id, id));
    if (!req) return reply.code(404).send({ error: 'not_found' });
    if (req.status !== 'pending') return reply.code(409).send({ error: 'not_pending' });
    // Quem pediu não decide o próprio pedido.
    if (req.requestedBy === actorId) return reply.code(409).send({ error: 'own_request' });
    return req;
  }

  app.post<{ Params: { id: string } }>('/deletion-requests/:id/reject', { config: { permission: 'deletion.decide' } }, async (request, reply) => {
    const req = await loadPending(request.params.id, request.user!.id, reply);
    if (!req || reply.sent) return reply;
    await db.transaction((tx) => decide(tx, req as DeletionRequest, 'rejected', request.user!.id));
    return { id: req.id, status: 'rejected' };
  });

  app.post<{ Params: { id: string } }>('/deletion-requests/:id/approve', { config: { permission: 'deletion.decide' } }, async (request, reply) => {
    const loaded = await loadPending(request.params.id, request.user!.id, reply);
    if (!loaded || reply.sent) return reply;
    const req = loaded as DeletionRequest;
    const actorId = request.user!.id;
    const item = await findItem(req.itemType, req.itemId);

    // Item que já saiu (excluído de outra forma): só fecha o pedido.
    if (!item || item.deleted) {
      await db.transaction((tx) => decide(tx, req, 'approved', actorId));
      return { id: req.id, status: 'approved' };
    }
    if (item.file) {
      const failed = await deleteFile(item.file, actorId, request, reply, req);
      return failed ?? { id: req.id, status: 'approved' };
    }
    if (item.note) {
      await db.transaction((tx) => deleteNote(tx, item.note, actorId, req));
      return { id: req.id, status: 'approved' };
    }
    // Projeto: sai do ERP e a pasta vai para a lixeira do Drive. Se o Drive falhar, o pedido continua pendente.
    const project = item.project!;
    try {
      await drive.trashFolder(project.driveFolderId);
    } catch (err) {
      return driveFailed(request, reply, err);
    }
    await db.transaction(async (tx) => {
      await tx.update(projects).set({ deletedAt: sql`now()` }).where(eq(projects.id, project.id));
      await decide(tx, req, 'approved', actorId);
      await audit(tx, {
        userId: actorId,
        action: 'project.delete',
        entity: 'project',
        entityId: project.id,
        payload: { name: project.name, clientName: project.clientName, driveFolderId: project.driveFolderId, trashedInDrive: true, requestId: req.id },
      });
    });
    return { id: req.id, status: 'approved' };
  });
}
