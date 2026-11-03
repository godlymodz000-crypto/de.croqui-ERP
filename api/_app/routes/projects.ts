import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { auditLog, projects, stages, users, type Project } from '../db/schema.js';
import { audit } from '../audit.js';
import { closePending } from '../notifications-service.js';
import { createProjectFolder, folderUrl, projectFolderName, type DriveClient } from '../drive.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME = 120;

interface ProjectBody {
  name?: unknown;
  clientName?: unknown;
  deadline?: unknown;
}

type Fields = Record<string, string>;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function validName(field: string, value: string, fields: Fields) {
  if (!value) fields[field] = 'required';
  else if (value.length > MAX_NAME) fields[field] = 'too_long';
}

/** Prazo opcional, no formato AAAA-MM-DD e com data que existe. */
function parseDeadline(value: unknown, fields: Fields): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    fields.deadline = 'invalid';
    return null;
  }
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) fields.deadline = 'invalid';
  return value;
}

function driveFailed(request: FastifyRequest, reply: FastifyReply, err: unknown) {
  request.log.error({ err: (err as Error)?.message ?? err }, 'falha no Google Drive');
  return reply.code(502).send({ error: 'drive_failed' });
}

export async function projectsRoutes(app: FastifyInstance, { db, drive }: { db: Db; drive: DriveClient }) {
  /** Monta a resposta com etapa, dono e quem fez a última alteração (pelo audit_log). */
  async function toDtos(rows: Project[]) {
    if (!rows.length) return [];
    const ids = rows.map((p) => p.id);
    const stageRows = await db.select().from(stages);
    const stageById = new Map(stageRows.map((s) => [s.id, s]));
    const lastEdits = await db
      .selectDistinctOn([auditLog.entityId], { projectId: auditLog.entityId, userName: users.name, userEmail: users.email })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.userId))
      .where(and(eq(auditLog.entity, 'project'), inArray(auditLog.entityId, ids)))
      .orderBy(auditLog.entityId, desc(auditLog.at));
    const editorById = new Map(lastEdits.map((e) => [e.projectId, e.userName ?? e.userEmail ?? null]));

    return rows.map((p) => {
      const stage = stageById.get(p.stageId);
      return {
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        stage: stage ? { id: stage.id, name: stage.name } : null,
        status: p.status,
        deadline: p.deadline,
        driveFolderId: p.driveFolderId,
        driveUrl: folderUrl(p.driveFolderId),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        updatedBy: editorById.get(p.id) ?? null,
      };
    });
  }

  async function findActive(id: string): Promise<Project | undefined> {
    if (!UUID_RE.test(id)) return undefined;
    const [p] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return p;
  }

  app.get('/projects', { config: { permission: 'workspace.read' } }, async () => {
    const rows = await db.select().from(projects).where(isNull(projects.deletedAt)).orderBy(desc(projects.updatedAt));
    return toDtos(rows);
  });

  app.get<{ Params: { id: string } }>('/projects/:id', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    const p = await findActive(request.params.id);
    if (!p) return reply.code(404).send({ error: 'not_found' });
    const [dto] = await toDtos([p]);
    return dto;
  });

  app.post<{ Body: ProjectBody }>('/projects', { config: { permission: 'projects.write' } }, async (request, reply) => {
    const body = request.body ?? {};
    const fields: Fields = {};
    const name = text(body.name);
    const clientName = text(body.clientName);
    validName('name', name, fields);
    validName('clientName', clientName, fields);
    const deadline = parseDeadline(body.deadline, fields);
    if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

    const [firstStage] = await db
      .select({ id: stages.id })
      .from(stages)
      .where(isNull(stages.deletedAt))
      .orderBy(asc(stages.position))
      .limit(1);
    if (!firstStage) throw new Error('Nenhuma etapa cadastrada.');

    // A pasta vem primeiro: se o Drive falhar, nada é gravado no banco.
    let folderId: string;
    try {
      folderId = await createProjectFolder(db, drive, clientName, name);
    } catch (err) {
      return driveFailed(request, reply, err);
    }

    const actor = request.user!;
    try {
      const created = await db.transaction(async (tx) => {
        const [p] = await tx
          .insert(projects)
          .values({ name, clientName, deadline, stageId: firstStage.id, ownerUserId: actor.id, driveFolderId: folderId })
          .returning();
        await audit(tx, {
          userId: actor.id,
          action: 'project.create',
          entity: 'project',
          entityId: p.id,
          payload: { name, clientName, deadline, driveFolderId: folderId },
        });
        return p;
      });
      const [dto] = await toDtos([created]);
      return reply.code(201).send(dto);
    } catch (err) {
      // O banco recusou depois da pasta criada: a pasta vai para a lixeira, para não ficar órfã.
      await drive.trashFolder(folderId).catch(() => {});
      throw err;
    }
  });

  app.patch<{ Params: { id: string }; Body: ProjectBody }>(
    '/projects/:id',
    { config: { permission: 'projects.write' } },
    async (request, reply) => {
      const current = await findActive(request.params.id);
      if (!current) return reply.code(404).send({ error: 'not_found' });

      const body = request.body ?? {};
      const fields: Fields = {};
      const name = body.name === undefined ? current.name : text(body.name);
      const clientName = body.clientName === undefined ? current.clientName : text(body.clientName);
      validName('name', name, fields);
      validName('clientName', clientName, fields);
      const deadline = body.deadline === undefined ? current.deadline : parseDeadline(body.deadline, fields);
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (name !== current.name) changes.name = { from: current.name, to: name };
      if (clientName !== current.clientName) changes.clientName = { from: current.clientName, to: clientName };
      if (deadline !== current.deadline) changes.deadline = { from: current.deadline, to: deadline };
      if (!Object.keys(changes).length) {
        const [dto] = await toDtos([current]);
        return dto;
      }

      // Renomear o projeto renomeia a pasta, sem trocar o ID. Se o Drive falhar, o banco não muda.
      const oldFolderName = projectFolderName(current.clientName, current.name);
      const newFolderName = projectFolderName(clientName, name);
      const renamesFolder = oldFolderName !== newFolderName;
      if (renamesFolder) {
        try {
          await drive.renameFolder(current.driveFolderId, newFolderName);
        } catch (err) {
          return driveFailed(request, reply, err);
        }
      }

      const actor = request.user!;
      try {
        const updated = await db.transaction(async (tx) => {
          const [p] = await tx
            .update(projects)
            .set({ name, clientName, deadline, updatedAt: new Date() })
            .where(and(eq(projects.id, current.id), isNull(projects.deletedAt)))
            .returning();
          await audit(tx, {
            userId: actor.id,
            action: 'project.update',
            entity: 'project',
            entityId: current.id,
            payload: { changes, driveFolderId: current.driveFolderId, folderRenamed: renamesFolder },
          });
          return p;
        });
        if (!updated) return reply.code(404).send({ error: 'not_found' });
        const [dto] = await toDtos([updated]);
        return dto;
      } catch (err) {
        if (renamesFolder) await drive.renameFolder(current.driveFolderId, oldFolderName).catch(() => {});
        throw err;
      }
    },
  );

  // Exclusão lógica no ERP; a pasta do projeto vai para a lixeira do Drive (recuperável por 30 dias).
  // Se o Drive falhar, nada muda no banco.
  app.delete<{ Params: { id: string } }>(
    '/projects/:id',
    { config: { permission: 'projects.delete' } },
    async (request, reply) => {
      const current = await findActive(request.params.id);
      if (!current) return reply.code(404).send({ error: 'not_found' });
      const actor = request.user!;
      try {
        await drive.trashFolder(current.driveFolderId);
      } catch (err) {
        return driveFailed(request, reply, err);
      }
      await db.transaction(async (tx) => {
        await tx
          .update(projects)
          .set({ deletedAt: sql`now()` })
          .where(eq(projects.id, current.id));
        // Pedido pendente de excluir este projeto fica resolvido pela exclusão direta.
        await closePending(tx, 'project', current.id, actor.id);
        await audit(tx, {
          userId: actor.id,
          action: 'project.delete',
          entity: 'project',
          entityId: current.id,
          payload: { name: current.name, clientName: current.clientName, driveFolderId: current.driveFolderId, trashedInDrive: true },
        });
      });
      return reply.code(204).send();
    },
  );
}
