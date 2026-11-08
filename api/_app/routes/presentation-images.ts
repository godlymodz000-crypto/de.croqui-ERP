import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { presentationImages, presentationImageUses, presentations, projects, users, type Presentation, type PresentationImage } from '../db/schema.js';
import { audit } from '../audit.js';
import type { DriveClient } from '../drive.js';
import { IMAGE_GRANT_TTL_MS, imagesFolderId, signImageGrant, verifyImageGrant, type ImageGrant } from '../presentation-images.js';
import { IMAGE_MAX_BYTES, IMAGE_MAX_SIDE, IMAGE_TYPES } from '../../../src/shared/presentation-calc.js';

// Imagens e biblioteca das apresentações (Fase 6b, etapa E4). O navegador reduz a imagem e a envia direto
// ao Drive; a API só abre a sessão, confere o arquivo no fim e registra na biblioteca. A biblioteca é a do
// projeto (compartilhada entre as apresentações dele) ou, na avulsa, a da própria apresentação (P23).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_NAME = 200;
/** Lado maior da imagem servida para a tela (P8). O PDF usa o original. */
const DISPLAY_SIZE = 1600;
/** Miniatura da biblioteca. */
const THUMB_SIZE = 220;
/** Sem imagem gerada pelo Drive, o original só passa pelo servidor se couber na resposta da Vercel (R3). */
const MAX_IMAGE_PASSTHROUGH = 4 * 1024 * 1024;

function driveFailed(request: FastifyRequest, reply: FastifyReply, err: unknown) {
  request.log.error({ err: (err as Error)?.message ?? err }, 'falha no Google Drive');
  return reply.code(502).send({ error: 'drive_failed' });
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

const isSide = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= IMAGE_MAX_SIDE;

interface Deps {
  db: Db;
  drive: DriveClient;
  sessionSecret: string;
  appOrigin: string;
}

export async function presentationImagesRoutes(app: FastifyInstance, { db, drive, sessionSecret, appOrigin }: Deps) {
  /** A apresentação, com a pasta do projeto no Drive. Apresentação de projeto excluído não existe. */
  async function findPresentation(id: string): Promise<{ p: Presentation; projectFolderId: string | null } | undefined> {
    if (!UUID_RE.test(id)) return undefined;
    const [row] = await db
      .select({ p: presentations, folder: projects.driveFolderId, deletedAt: projects.deletedAt })
      .from(presentations)
      .leftJoin(projects, eq(projects.id, presentations.projectId))
      .where(eq(presentations.id, id));
    if (!row) return undefined;
    if (row.p.projectId && (!row.folder || row.deletedAt)) return undefined;
    return { p: row.p, projectFolderId: row.p.projectId ? row.folder : null };
  }

  /** Condição da biblioteca desta apresentação: a do projeto ou, na avulsa, a própria. */
  const libraryOf = (p: Presentation) =>
    p.projectId ? eq(presentationImages.projectId, p.projectId) : eq(presentationImages.ownerPresentationId, p.id);

  async function dtos(rows: PresentationImage[]) {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const uses = await db
      .select({ imageId: presentationImageUses.imageId, n: count() })
      .from(presentationImageUses)
      .where(inArray(presentationImageUses.imageId, ids))
      .groupBy(presentationImageUses.imageId);
    const usesById = new Map(uses.map((u) => [u.imageId, Number(u.n)]));
    const authorIds = [...new Set(rows.map((r) => r.createdBy).filter((id): id is string => !!id))];
    const authors = authorIds.length
      ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, authorIds))
      : [];
    const authorById = new Map(authors.map((u) => [u.id, u.name ?? u.email]));
    return rows.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      mimeType: r.mimeType,
      widthPx: r.widthPx,
      heightPx: r.heightPx,
      sizeBytes: r.sizeBytes,
      createdAt: r.createdAt.toISOString(),
      createdBy: r.createdBy ? (authorById.get(r.createdBy) ?? null) : null,
      // Quantas apresentações usam a imagem agora.
      usedBy: usesById.get(r.id) ?? 0,
    }));
  }

  // Biblioteca da apresentação: imagens já enviadas, que ainda não foram para a lixeira.
  app.get<{ Params: { id: string } }>('/presentations/:id/images', { config: { permission: 'documents.write' } }, async (request, reply) => {
    const found = await findPresentation(request.params.id);
    if (!found) return reply.code(404).send({ error: 'not_found' });
    const rows = await db
      .select()
      .from(presentationImages)
      .where(and(libraryOf(found.p), isNull(presentationImages.trashedAt)))
      .orderBy(desc(presentationImages.createdAt));
    return dtos(rows);
  });

  /**
   * Abre a sessão de envio no Drive, na pasta Imagens. O navegador já reduziu a imagem: o servidor só
   * aceita PNG, JPEG ou WebP, até 40 MB e até 4000 px no lado maior.
   */
  app.post<{ Params: { id: string }; Body: { name?: unknown; mimeType?: unknown; size?: unknown; width?: unknown; height?: unknown } }>(
    '/presentations/:id/images/uploads',
    { config: { permission: 'documents.write' } },
    async (request, reply) => {
      const body = request.body ?? {};
      const fields: Record<string, string> = {};
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) fields.name = 'required';
      else if (name.length > MAX_FILE_NAME || /[\\/]/.test(name)) fields.name = 'invalid';
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
      if (!(IMAGE_TYPES as readonly string[]).includes(mimeType)) fields.mimeType = 'unsupported';
      const size = typeof body.size === 'number' && Number.isInteger(body.size) ? body.size : -1;
      if (size <= 0) fields.size = 'invalid';
      else if (size > IMAGE_MAX_BYTES) fields.size = 'too_large';
      if (!isSide(body.width) || !isSide(body.height)) fields.dimensions = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      const found = await findPresentation(request.params.id);
      if (!found) return reply.code(404).send({ error: 'not_found' });
      let folderId: string;
      let uploadUrl: string;
      try {
        folderId = await imagesFolderId(db, drive, found.projectFolderId);
        uploadUrl = await drive.createUploadSession({ name, mimeType, size, parentId: folderId, origin: appOrigin });
      } catch (err) {
        return driveFailed(request, reply, err);
      }
      const grant: ImageGrant = {
        presentationId: found.p.id,
        folderId,
        name,
        mimeType,
        size,
        width: body.width as number,
        height: body.height as number,
        userId: request.user!.id,
        expiresAt: Date.now() + IMAGE_GRANT_TTL_MS,
      };
      return reply.code(201).send({ uploadUrl, token: signImageGrant(grant, sessionSecret) });
    },
  );

  /**
   * O navegador terminou de enviar: o servidor confere o arquivo no Drive contra a autorização e só então
   * registra na biblioteca. Arquivo que não confere vai para a lixeira e nada é gravado.
   */
  app.post<{ Params: { id: string }; Body: { token?: unknown; driveFileId?: unknown } }>(
    '/presentations/:id/images/complete',
    { config: { permission: 'documents.write' } },
    async (request, reply) => {
      const grant = verifyImageGrant(request.body?.token, sessionSecret);
      const driveFileId = request.body?.driveFileId;
      if (!grant || grant.presentationId !== request.params.id || grant.userId !== request.user!.id) {
        return reply.code(400).send({ error: 'invalid_upload' });
      }
      if (typeof driveFileId !== 'string' || !/^[\w-]{1,200}$/.test(driveFileId)) return reply.code(400).send({ error: 'invalid_upload' });
      const found = await findPresentation(grant.presentationId);
      if (!found) return reply.code(404).send({ error: 'not_found' });

      let file;
      try {
        file = await drive.getFile(driveFileId);
      } catch (err) {
        return driveFailed(request, reply, err);
      }
      const inFolder = !!file && file.parents.includes(grant.folderId);
      // As medidas que o Drive leu, quando já leu, têm de bater com as declaradas.
      const dimsOk = !file?.imageWidth || (file.imageWidth === grant.width && file.imageHeight === grant.height);
      if (!file || file.trashed || !inFolder || file.name !== grant.name || file.size !== grant.size || file.mimeType !== grant.mimeType || !dimsOk) {
        // Só mexe no que está na pasta autorizada; um ID de fora nunca é tocado.
        if (file && inFolder && !file.trashed) await drive.trashFile(file.id).catch(() => {});
        return reply.code(409).send({ error: 'upload_mismatch' });
      }

      const actor = request.user!;
      const { p } = found;
      try {
        const created = await db.transaction(async (tx) => {
          const [row] = await tx
            .insert(presentationImages)
            .values({
              projectId: p.projectId,
              ownerPresentationId: p.projectId ? null : p.id,
              driveFileId: file.id,
              fileName: file.name,
              mimeType: file.mimeType,
              widthPx: grant.width,
              heightPx: grant.height,
              sizeBytes: file.size,
              createdBy: actor.id,
            })
            .returning();
          await audit(tx, {
            userId: actor.id,
            action: 'presentation.image_upload',
            entity: 'presentation_image',
            entityId: row.id,
            payload: {
              presentationId: p.id,
              projectId: p.projectId,
              fileName: row.fileName,
              sizeBytes: row.sizeBytes,
              widthPx: row.widthPx,
              heightPx: row.heightPx,
              driveFileId: row.driveFileId,
            },
          });
          return row;
        });
        return reply.code(201).send((await dtos([created]))[0]);
      } catch (err) {
        if (isUniqueViolation(err)) return reply.code(409).send({ error: 'already_registered' });
        throw err;
      }
    },
  );

  /** Imagem da biblioteca que ainda não foi para a lixeira, de projeto não excluído. */
  async function findImage(id: string): Promise<PresentationImage | undefined> {
    if (!UUID_RE.test(id)) return undefined;
    const [row] = await db
      .select({ img: presentationImages, deletedAt: projects.deletedAt })
      .from(presentationImages)
      .leftJoin(projects, eq(projects.id, presentationImages.projectId))
      .where(and(eq(presentationImages.id, id), isNull(presentationImages.trashedAt)));
    if (!row || row.deletedAt) return undefined;
    return row.img;
  }

  async function serve(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply, size: number) {
    const img = await findImage(request.params.id);
    if (!img) return reply.code(404).send({ error: 'not_found' });
    const image =
      (await drive.thumbnail(img.driveFileId, size).catch(() => null)) ??
      (await drive.download(img.driveFileId, MAX_IMAGE_PASSTHROUGH).catch(() => null));
    if (!image) return reply.code(404).send({ error: 'no_image' });
    return reply.header('content-type', image.contentType).header('cache-control', 'private, max-age=3600').send(Buffer.from(image.body));
  }

  // Imagem para a visualização (1600 px no lado maior) e miniatura da biblioteca. Quem vê a apresentação
  // vê as imagens dela.
  app.get<{ Params: { id: string } }>('/presentation-images/:id/image', { config: { permission: 'workspace.read' } }, (request, reply) =>
    serve(request, reply, DISPLAY_SIZE),
  );
  app.get<{ Params: { id: string } }>('/presentation-images/:id/thumbnail', { config: { permission: 'workspace.read' } }, (request, reply) =>
    serve(request, reply, THUMB_SIZE),
  );
}
