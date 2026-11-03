import type { FastifyInstance } from 'fastify';
import { and, asc, eq, isNull, max, ne, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { projects, projectStageHistory, stages, users, type Project } from '../db/schema.js';
import { audit } from '../audit.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_STAGE_NAME = 40;

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/** Cartão do Kanban: só o que a coluna mostra. A tela do projeto continua com o DTO completo. */
export interface BoardCard {
  id: string;
  name: string;
  clientName: string;
  stageId: string;
  deadline: string | null;
  owner: string | null;
}

/** Ordem dentro da coluna: prazo mais próximo primeiro, sem prazo no fim; prazos iguais por nome. */
export function compareCards(a: Pick<BoardCard, 'deadline' | 'name'>, b: Pick<BoardCard, 'deadline' | 'name'>) {
  if (a.deadline !== b.deadline) {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  }
  return a.name.localeCompare(b.name, 'pt-BR');
}

/** Grava a mudança de etapa de um projeto: projeto, histórico e audit_log, na mesma transação. */
async function moveProject(tx: Tx, project: Project, toStageId: string, userId: string, reason: 'move' | 'stage_removed') {
  await tx.update(projects).set({ stageId: toStageId, updatedAt: new Date() }).where(eq(projects.id, project.id));
  await tx.insert(projectStageHistory).values({ projectId: project.id, fromStageId: project.stageId, toStageId, userId });
  await audit(tx, {
    userId,
    action: 'project.move',
    entity: 'project',
    entityId: project.id,
    payload: { fromStageId: project.stageId, toStageId, reason },
  });
}

export async function stagesRoutes(app: FastifyInstance, { db }: { db: Db }) {
  async function activeStages(executor: Pick<Db, 'select'> = db) {
    return executor
      .select({ id: stages.id, name: stages.name, position: stages.position })
      .from(stages)
      .where(isNull(stages.deletedAt))
      .orderBy(asc(stages.position), asc(stages.createdAt));
  }

  /** Nome obrigatório, curto e sem repetir o de outra etapa ativa (sem diferenciar maiúsculas). */
  async function nameError(name: string, exceptId?: string): Promise<string | null> {
    if (!name) return 'required';
    if (name.length > MAX_STAGE_NAME) return 'too_long';
    const conds = [isNull(stages.deletedAt), sql`lower(${stages.name}) = lower(${name})`];
    if (exceptId) conds.push(ne(stages.id, exceptId));
    const [dup] = await db.select({ id: stages.id }).from(stages).where(and(...conds)).limit(1);
    return dup ? 'taken' : null;
  }

  // Kanban numa leitura só: etapas e cartões juntos.
  app.get('/board', { config: { permission: 'workspace.read' } }, async () => {
    const stageRows = await activeStages();
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        clientName: projects.clientName,
        stageId: projects.stageId,
        deadline: projects.deadline,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(projects)
      .leftJoin(users, eq(users.id, projects.ownerUserId))
      .where(isNull(projects.deletedAt));
    const cards: BoardCard[] = rows
      .map(({ ownerName, ownerEmail, ...p }) => ({ ...p, owner: ownerName ?? ownerEmail ?? null }))
      .sort(compareCards);
    return { stages: stageRows, projects: cards };
  });

  app.post<{ Body: { name?: unknown } }>('/stages', { config: { permission: 'stages.manage' } }, async (request, reply) => {
    const name = text(request.body?.name);
    const error = await nameError(name);
    if (error) return reply.code(400).send({ error: 'validation', fields: { name: error } });
    const actor = request.user!;
    const created = await db.transaction(async (tx) => {
      // Nova etapa entra no fim do quadro.
      const [{ last }] = await tx.select({ last: max(stages.position) }).from(stages).where(isNull(stages.deletedAt));
      const [s] = await tx
        .insert(stages)
        .values({ name, position: (last ?? 0) + 1 })
        .returning({ id: stages.id, name: stages.name, position: stages.position });
      await audit(tx, { userId: actor.id, action: 'stage.create', entity: 'stage', entityId: s.id, payload: { name, position: s.position } });
      return s;
    });
    return reply.code(201).send(created);
  });

  app.patch<{ Params: { id: string }; Body: { name?: unknown } }>(
    '/stages/:id',
    { config: { permission: 'stages.manage' } },
    async (request, reply) => {
      const { id } = request.params;
      const [current] = UUID_RE.test(id)
        ? await db.select().from(stages).where(and(eq(stages.id, id), isNull(stages.deletedAt)))
        : [];
      if (!current) return reply.code(404).send({ error: 'not_found' });
      const name = text(request.body?.name);
      const error = await nameError(name, current.id);
      if (error) return reply.code(400).send({ error: 'validation', fields: { name: error } });
      const dto = { id: current.id, name, position: current.position };
      if (name === current.name) return dto;
      const actor = request.user!;
      await db.transaction(async (tx) => {
        await tx.update(stages).set({ name }).where(eq(stages.id, current.id));
        await audit(tx, { userId: actor.id, action: 'stage.rename', entity: 'stage', entityId: current.id, payload: { from: current.name, to: name } });
      });
      return dto;
    },
  );

  // Remoção lógica. Os projetos da etapa vão para a etapa de destino; nenhum projeto fica sem etapa.
  app.delete<{ Params: { id: string }; Body: { destinationStageId?: unknown } | undefined }>(
    '/stages/:id',
    { config: { permission: 'stages.manage' } },
    async (request, reply) => {
      const { id } = request.params;
      if (!UUID_RE.test(id)) return reply.code(404).send({ error: 'not_found' });
      const rawDest = request.body?.destinationStageId;
      const destId = typeof rawDest === 'string' && rawDest ? rawDest : null;
      const actor = request.user!;

      const result = await db.transaction(async (tx) => {
        // Trava as etapas ativas: duas remoções ao mesmo tempo não deixam projeto sem destino.
        const active = await tx
          .select({ id: stages.id, name: stages.name })
          .from(stages)
          .where(isNull(stages.deletedAt))
          .for('update');
        const current = active.find((s) => s.id === id);
        if (!current) return { status: 404, body: { error: 'not_found' } } as const;
        if (active.length === 1) return { status: 409, body: { error: 'last_stage' } } as const;

        const inStage = await tx
          .select()
          .from(projects)
          .where(and(eq(projects.stageId, current.id), isNull(projects.deletedAt)))
          .for('update');
        let dest: { id: string; name: string } | undefined;
        if (inStage.length || destId) {
          if (!destId) return { status: 400, body: { error: 'destination_required', projects: inStage.length } } as const;
          dest = active.find((s) => s.id === destId && s.id !== current.id);
          if (!dest) return { status: 400, body: { error: 'invalid_destination' } } as const;
        }

        for (const p of inStage) await moveProject(tx, p, dest!.id, actor.id, 'stage_removed');
        await tx.update(stages).set({ deletedAt: sql`now()` }).where(eq(stages.id, current.id));
        await audit(tx, {
          userId: actor.id,
          action: 'stage.delete',
          entity: 'stage',
          entityId: current.id,
          payload: { name: current.name, destinationStageId: dest?.id ?? null, movedProjectIds: inStage.map((p) => p.id) },
        });
        return { status: 204 } as const;
      });
      if (result.status === 204) return reply.code(204).send();
      return reply.code(result.status).send(result.body);
    },
  );

  // Mudar a etapa de um projeto (arrastar no Kanban ou "Mover para").
  app.patch<{ Params: { id: string }; Body: { stageId?: unknown } }>(
    '/projects/:id/stage',
    { config: { permission: 'projects.move' } },
    async (request, reply) => {
      const { id } = request.params;
      const toStageId = request.body?.stageId;
      if (!UUID_RE.test(id)) return reply.code(404).send({ error: 'not_found' });
      if (typeof toStageId !== 'string' || !UUID_RE.test(toStageId)) {
        return reply.code(400).send({ error: 'validation', fields: { stageId: 'required' } });
      }
      const actor = request.user!;
      const result = await db.transaction(async (tx) => {
        const [project] = await tx
          .select()
          .from(projects)
          .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
          .for('update');
        if (!project) return { status: 404, body: { error: 'not_found' } } as const;
        // Trava a etapa de destino: não some no meio do movimento.
        const [stage] = await tx
          .select({ id: stages.id })
          .from(stages)
          .where(and(eq(stages.id, toStageId), isNull(stages.deletedAt)))
          .for('update');
        if (!stage) return { status: 400, body: { error: 'invalid_stage' } } as const;
        // Soltar na mesma coluna não é movimento: nada é gravado.
        if (project.stageId !== stage.id) await moveProject(tx, project, stage.id, actor.id, 'move');
        return { status: 200, body: { id: project.id, stageId: stage.id } } as const;
      });
      return reply.code(result.status).send(result.body);
    },
  );
}

