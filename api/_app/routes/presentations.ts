import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { auditLog, presentationImages, presentations, projects, users, type Presentation } from '../db/schema.js';
import { audit } from '../audit.js';
import { fileViewUrl, type DriveClient } from '../drive.js';
import { ImagesUnavailableError, syncImageUses, trashUnusedImages } from '../presentation-images.js';
import {
  emptyPresentation,
  parsePresentationData,
  PRESENTATION_MAX_BYTES,
  presentationBytes,
  presentationImageIds,
  type PresentationData,
} from '../../../src/shared/presentation-data.js';

// Apresentações (Fase 6b, etapas E3 e E4): lista, leitura, criação e salvamento automático, com os vínculos
// das imagens e a regra da lixeira. Envio e biblioteca em routes/presentation-images.ts. Vínculo a projeto
// e PDF entram nas etapas seguintes. Mesmo padrão de routes/budgets.ts.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NAME = 120;
/**
 * Corpo do salvamento automático. Maior que o limite do documento (512 KB), para que um documento grande
 * demais chegue à rota e receba a resposta própria (413 `too_large`), e não o erro genérico do servidor.
 */
const BODY_LIMIT = 1024 * 1024;

function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function nameError(name: string): string | null {
  if (!name) return 'required';
  if (name.length > MAX_NAME) return 'too_long';
  return null;
}

interface CreateBody {
  name?: unknown;
  projectId?: unknown;
}
interface UpdateBody {
  name?: unknown;
  data?: unknown;
  /** updatedAt que a tela leu. Se a apresentação mudou depois disso (outra aba ou pessoa), responde 409. */
  baseUpdatedAt?: unknown;
}

/** Ações do histórico que contam como "alterado por" na lista. */
const EDIT_ACTIONS = ['presentation.create', 'presentation.update'];

export async function presentationsRoutes(app: FastifyInstance, { db, drive }: { db: Db; drive: DriveClient }) {
  async function activeProject(id: string) {
    if (!UUID_RE.test(id)) return undefined;
    const [p] = await db
      .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return p;
  }

  async function find(id: string): Promise<Presentation | undefined> {
    if (!UUID_RE.test(id)) return undefined;
    const [p] = await db.select().from(presentations).where(eq(presentations.id, id));
    if (!p) return undefined;
    // Apresentação de projeto excluído some junto com o projeto.
    if (p.projectId && !(await activeProject(p.projectId))) return undefined;
    return p;
  }

  /** Resposta da API. A lista vem sem o conteúdo (`data`); cliente e quem alterou por último vêm junto. */
  async function dtos(rows: Presentation[], withData: boolean) {
    if (!rows.length) return [];
    const ids = rows.map((p) => p.id);
    const projectIds = [...new Set(rows.map((p) => p.projectId).filter((id): id is string => !!id))];
    const projectRows = projectIds.length
      ? await db
          .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
          .from(projects)
          .where(and(inArray(projects.id, projectIds), isNull(projects.deletedAt)))
      : [];
    const projectById = new Map(projectRows.map((p) => [p.id, p]));
    const authorIds = [...new Set(rows.map((p) => p.createdBy).filter((id): id is string => !!id))];
    const authorRows = authorIds.length
      ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, authorIds))
      : [];
    const authorById = new Map(authorRows.map((u) => [u.id, u.name ?? u.email]));
    const lastEdits = await db
      .selectDistinctOn([auditLog.entityId], { presentationId: auditLog.entityId, userName: users.name, userEmail: users.email })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.userId))
      .where(and(eq(auditLog.entity, 'presentation'), inArray(auditLog.entityId, ids), inArray(auditLog.action, EDIT_ACTIONS)))
      .orderBy(auditLog.entityId, desc(auditLog.at));
    const editorById = new Map(lastEdits.map((e) => [e.presentationId, e.userName ?? e.userEmail ?? null]));

    return rows.map((p) => {
      const project = p.projectId ? (projectById.get(p.projectId) ?? null) : null;
      const data = p.data as Partial<PresentationData>;
      const cliente = typeof data.projeto?.cliente === 'string' ? data.projeto.cliente.trim() : '';
      return {
        id: p.id,
        number: p.number,
        name: p.name,
        projectId: p.projectId,
        project,
        // Cliente da apresentação: o da aba Projeto; sem isso, o cliente do projeto.
        clientName: cliente || project?.clientName || null,
        pageCount: p.pageCount,
        createdBy: p.createdBy ? (authorById.get(p.createdBy) ?? null) : null,
        updatedAt: p.updatedAt.toISOString(),
        updatedBy: editorById.get(p.id) ?? null,
        pdf: pdfDto(p),
        ...(withData ? { data: p.data } : {}),
      };
    });
  }
  const dto = async (p: Presentation, withData: boolean) => (await dtos([p], withData))[0];

  /** PDF mais recente no Drive (gerado a partir da E9). */
  function pdfDto(p: Presentation) {
    if (!p.pdfDriveFileId) return null;
    return {
      driveFileId: p.pdfDriveFileId,
      name: p.pdfName,
      version: Number(/-v(\d+)\.pdf$/.exec(p.pdfName ?? '')?.[1] ?? 1),
      exportedAt: p.pdfExportedAt?.toISOString() ?? null,
      url: fileViewUrl(p.pdfDriveFileId),
    };
  }

  /**
   * Imagens citadas que não estão na biblioteca desta apresentação: a do projeto ou, na avulsa, a própria.
   * Imagem que já foi para a lixeira também não vale.
   */
  async function foreignImages(p: Presentation, ids: string[]): Promise<string[]> {
    if (!ids.length) return [];
    const library = p.projectId ? eq(presentationImages.projectId, p.projectId) : eq(presentationImages.ownerPresentationId, p.id);
    const found = await db
      .select({ id: presentationImages.id })
      .from(presentationImages)
      .where(and(inArray(presentationImages.id, ids), library, isNull(presentationImages.trashedAt)));
    const ok = new Set(found.map((r) => r.id));
    return ids.filter((id) => !ok.has(id));
  }

  // Lista: ?projectId=<id> traz as apresentações do projeto; ?semProjeto=1, as avulsas. Sem filtro, todas.
  app.get<{ Querystring: { projectId?: string; semProjeto?: string } }>(
    '/presentations',
    { config: { permission: 'workspace.read' } },
    async (request, reply) => {
      const { projectId, semProjeto } = request.query;
      if (projectId !== undefined && !(await activeProject(projectId))) return reply.code(404).send({ error: 'not_found' });
      const rows = await db
        .select({ presentation: presentations })
        .from(presentations)
        .leftJoin(projects, eq(projects.id, presentations.projectId))
        .where(
          projectId !== undefined
            ? eq(presentations.projectId, projectId)
            : semProjeto === '1'
              ? isNull(presentations.projectId)
              : // Todas: avulsas e de projetos que não foram excluídos.
                or(isNull(presentations.projectId), isNull(projects.deletedAt)),
        )
        .orderBy(desc(presentations.updatedAt));
      return dtos(rows.map((r) => r.presentation), false);
    },
  );

  app.get<{ Params: { id: string } }>('/presentations/:id', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    const p = await find(request.params.id);
    if (!p) return reply.code(404).send({ error: 'not_found' });
    return dto(p, true);
  });

  // "Nova apresentação": nome obrigatório; projeto opcional (sem projeto, fica em Sem projeto). Nasce só
  // com a capa e zerada; do projeto, copia o nome e o cliente como texto editável.
  app.post<{ Body: CreateBody }>('/presentations', { config: { permission: 'documents.write' } }, async (request, reply) => {
    const body = request.body ?? {};
    const fields: Record<string, string> = {};
    const name = cleanName(body.name);
    const err = nameError(name);
    if (err) fields.name = err;
    let project: Awaited<ReturnType<typeof activeProject>> = undefined;
    if (body.projectId !== undefined && body.projectId !== null && body.projectId !== '') {
      project = typeof body.projectId === 'string' ? await activeProject(body.projectId) : undefined;
      if (!project) fields.projectId = 'not_found';
    }
    if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

    // O cadastro do projeto não tem localização: o campo começa vazio e é preenchido no editor.
    const data = emptyPresentation(randomUUID(), project ? { nome: project.name, cliente: project.clientName } : {});
    const actor = request.user!;
    const created = await db.transaction(async (tx) => {
      const [p] = await tx
        .insert(presentations)
        .values({
          name,
          projectId: project?.id ?? null,
          data: data as unknown as Record<string, unknown>,
          pageCount: data.paginas.length,
          createdBy: actor.id,
        })
        .returning();
      await audit(tx, {
        userId: actor.id,
        action: 'presentation.create',
        entity: 'presentation',
        entityId: p.id,
        payload: { name, number: p.number, projectId: project?.id ?? null },
      });
      return p;
    });
    return reply.code(201).send(await dto(created, true));
  });

  // Salvamento automático do editor e troca de nome. O vínculo com projeto muda em rota própria (E5).
  app.patch<{ Params: { id: string }; Body: UpdateBody }>(
    '/presentations/:id',
    { config: { permission: 'documents.write' }, bodyLimit: BODY_LIMIT },
    async (request, reply) => {
      const current = await find(request.params.id);
      if (!current) return reply.code(404).send({ error: 'not_found' });
      const body = request.body ?? {};
      const fields: Record<string, string> = {};

      const name = body.name === undefined ? current.name : cleanName(body.name);
      const err = nameError(name);
      if (err) fields.name = err;
      // Limite de 512 KB conferido no documento como chegou, antes de descartar campos desconhecidos.
      if (body.data !== undefined) {
        const size = presentationBytes(body.data);
        if (size > PRESENTATION_MAX_BYTES) return reply.code(413).send({ error: 'too_large', size, limit: PRESENTATION_MAX_BYTES });
      }
      let data: PresentationData | null = null;
      if (body.data !== undefined) {
        const parsed = parsePresentationData(body.data);
        if ('error' in parsed) fields.data = parsed.error;
        else data = parsed.data;
      }
      if (body.baseUpdatedAt !== undefined && typeof body.baseUpdatedAt !== 'string') fields.baseUpdatedAt = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      if (data) {
        const foreign = await foreignImages(current, presentationImageIds(data));
        if (foreign.length) return reply.code(400).send({ error: 'validation', fields: { data: 'image_not_in_library' }, images: foreign });
      }

      if (typeof body.baseUpdatedAt === 'string' && body.baseUpdatedAt !== current.updatedAt.toISOString()) {
        return reply.code(409).send({ error: 'conflict', current: await dto(current, true) });
      }

      const changed: string[] = [];
      if (name !== current.name) changed.push('name');
      if (data) {
        // O jsonb do banco muda a ordem das chaves: compara as duas versões na mesma forma normalizada.
        const stored = parsePresentationData(current.data);
        if (!('data' in stored) || JSON.stringify(stored.data) !== JSON.stringify(data)) changed.push('data');
      }
      if (!changed.length) return dto(current, true);

      const actor = request.user!;
      let unused: { id: string; driveFileId: string }[] = [];
      let updated: Presentation;
      try {
        updated = await db.transaction(async (tx) => {
          // Vínculos com as imagens citadas, na mesma transação. As que ficarem sem nenhum uso saem da biblioteca.
          if (changed.includes('data') && data) unused = await syncImageUses(tx, current.id, presentationImageIds(data));
          const [p] = await tx
            .update(presentations)
            .set({
              name,
              ...(data ? { data: data as unknown as Record<string, unknown>, pageCount: data.paginas.length } : {}),
              updatedAt: new Date(),
            })
            .where(eq(presentations.id, current.id))
            .returning();
          await audit(tx, {
            userId: actor.id,
            action: 'presentation.update',
            entity: 'presentation',
            entityId: current.id,
            // Só o que mudou; o conteúdo da apresentação não é copiado para o histórico.
            payload: {
              changed,
              ...(changed.includes('name') ? { name: { from: current.name, to: name } } : {}),
            },
          });
          return p;
        });
      } catch (err) {
        if (err instanceof ImagesUnavailableError) {
          return reply.code(400).send({ error: 'validation', fields: { data: 'image_not_in_library' }, images: err.ids });
        }
        throw err;
      }

      // Regra da lixeira (P22): depois do commit, a imagem que nenhuma apresentação usa mais vai para a
      // lixeira do Drive. Se o Drive falhar, ela volta para a biblioteca e o salvamento continua valendo.
      if (unused.length) {
        const trashed = await trashUnusedImages(db, drive, unused, (err, imageId) =>
          request.log.error({ err: (err as Error)?.message ?? err, imageId }, 'falha ao mandar imagem para a lixeira do Drive'),
        );
        for (const id of trashed) {
          const img = unused.find((u) => u.id === id)!;
          await audit(db, {
            userId: actor.id,
            action: 'presentation.image_trash',
            entity: 'presentation_image',
            entityId: id,
            payload: { presentationId: current.id, driveFileId: img.driveFileId, reason: 'sem_uso' },
          });
        }
      }
      return dto(updated, true);
    },
  );
}
