import type { FastifyInstance } from 'fastify';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { auditLog, budgets, projects, users, type Budget } from '../db/schema.js';
import { audit } from '../audit.js';
import { budgetHeadlineCents, emptyBudget, parseBudgetData, type BudgetData } from '../../../src/shared/budget-calc.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NAME = 120;
/** Corpo do salvamento automático: o JSON do orçamento cabe com folga (200 ambientes e textos longos). */
const BODY_LIMIT = 256 * 1024;

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
  /** updatedAt que a tela leu. Se o orçamento mudou depois disso (outra aba ou pessoa), responde 409. */
  baseUpdatedAt?: unknown;
}

export async function budgetsRoutes(app: FastifyInstance, { db }: { db: Db }) {
  async function activeProject(id: string) {
    if (!UUID_RE.test(id)) return undefined;
    const [p] = await db
      .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return p;
  }

  async function find(id: string): Promise<Budget | undefined> {
    if (!UUID_RE.test(id)) return undefined;
    const [b] = await db.select().from(budgets).where(eq(budgets.id, id));
    if (!b) return undefined;
    // Orçamento de projeto excluído some junto com o projeto.
    if (b.projectId && !(await activeProject(b.projectId))) return undefined;
    return b;
  }

  /** Resposta da API. A lista vem sem o conteúdo (`data`); cliente e quem alterou por último vêm junto. */
  async function dtos(rows: Budget[], withData: boolean) {
    if (!rows.length) return [];
    const ids = rows.map((b) => b.id);
    const projectIds = [...new Set(rows.map((b) => b.projectId).filter((id): id is string => !!id))];
    const projectRows = projectIds.length
      ? await db
          .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
          .from(projects)
          .where(and(inArray(projects.id, projectIds), isNull(projects.deletedAt)))
      : [];
    const projectById = new Map(projectRows.map((p) => [p.id, p]));
    const authorIds = [...new Set(rows.map((b) => b.createdBy).filter((id): id is string => !!id))];
    const authorRows = authorIds.length
      ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, authorIds))
      : [];
    const authorById = new Map(authorRows.map((u) => [u.id, u.name ?? u.email]));
    const lastEdits = await db
      .selectDistinctOn([auditLog.entityId], { budgetId: auditLog.entityId, userName: users.name, userEmail: users.email })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.userId))
      .where(and(eq(auditLog.entity, 'budget'), inArray(auditLog.entityId, ids)))
      .orderBy(auditLog.entityId, desc(auditLog.at));
    const editorById = new Map(lastEdits.map((e) => [e.budgetId, e.userName ?? e.userEmail ?? null]));

    return rows.map((b) => {
      const project = b.projectId ? (projectById.get(b.projectId) ?? null) : null;
      const data = { ...emptyBudget(), ...(b.data as Partial<BudgetData>) };
      return {
        id: b.id,
        number: b.number,
        name: b.name,
        status: b.status,
        projectId: b.projectId,
        project,
        // Cliente do orçamento: o que foi preenchido no editor; sem isso, o cliente do projeto.
        clientName: data.cliente.trim() || project?.clientName || null,
        totalCents: b.totalCents,
        createdBy: b.createdBy ? (authorById.get(b.createdBy) ?? null) : null,
        updatedAt: b.updatedAt.toISOString(),
        updatedBy: editorById.get(b.id) ?? null,
        ...(withData ? { data } : {}),
      };
    });
  }
  const dto = async (b: Budget, withData: boolean) => (await dtos([b], withData))[0];

  // Lista: ?projectId=<id> traz os orçamentos do projeto; ?semProjeto=1, os avulsos. Sem filtro, todos.
  app.get<{ Querystring: { projectId?: string; semProjeto?: string } }>(
    '/budgets',
    { config: { permission: 'workspace.read' } },
    async (request, reply) => {
      const { projectId, semProjeto } = request.query;
      if (projectId !== undefined && !(await activeProject(projectId))) return reply.code(404).send({ error: 'not_found' });
      const rows = await db
        .select({ budget: budgets })
        .from(budgets)
        .leftJoin(projects, eq(projects.id, budgets.projectId))
        .where(
          projectId !== undefined
            ? eq(budgets.projectId, projectId)
            : semProjeto === '1'
              ? isNull(budgets.projectId)
              : // Todos: avulsos e de projetos que não foram excluídos.
                isNull(projects.deletedAt),
        )
        .orderBy(desc(budgets.updatedAt));
      return dtos(rows.map((r) => r.budget), false);
    },
  );

  app.get<{ Params: { id: string } }>('/budgets/:id', { config: { permission: 'workspace.read' } }, async (request, reply) => {
    const b = await find(request.params.id);
    if (!b) return reply.code(404).send({ error: 'not_found' });
    return dto(b, true);
  });

  // "Novo orçamento": nome obrigatório; projeto opcional (sem projeto, fica em Orçamentos > Sem projeto).
  // O conteúdo começa zerado.
  app.post<{ Body: CreateBody }>('/budgets', { config: { permission: 'documents.write' } }, async (request, reply) => {
    const body = request.body ?? {};
    const fields: Record<string, string> = {};
    const name = cleanName(body.name);
    const err = nameError(name);
    if (err) fields.name = err;
    let projectId: string | null = null;
    if (body.projectId !== undefined && body.projectId !== null && body.projectId !== '') {
      const project = typeof body.projectId === 'string' ? await activeProject(body.projectId) : undefined;
      if (!project) fields.projectId = 'not_found';
      else projectId = project.id;
    }
    if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

    const actor = request.user!;
    const created = await db.transaction(async (tx) => {
      const [b] = await tx
        .insert(budgets)
        .values({ name, projectId, data: emptyBudget() as unknown as Record<string, unknown>, totalCents: 0, createdBy: actor.id })
        .returning();
      await audit(tx, {
        userId: actor.id,
        action: 'budget.create',
        entity: 'budget',
        entityId: b.id,
        payload: { name, number: b.number, projectId },
      });
      return b;
    });
    return reply.code(201).send(await dto(created, true));
  });

  // Salvamento automático do editor e troca de nome. O vínculo com projeto não muda aqui (fase seguinte).
  app.patch<{ Params: { id: string }; Body: UpdateBody }>(
    '/budgets/:id',
    { config: { permission: 'documents.write' }, bodyLimit: BODY_LIMIT },
    async (request, reply) => {
      const current = await find(request.params.id);
      if (!current) return reply.code(404).send({ error: 'not_found' });
      const body = request.body ?? {};
      const fields: Record<string, string> = {};

      const name = body.name === undefined ? current.name : cleanName(body.name);
      const err = nameError(name);
      if (err) fields.name = err;
      let data: BudgetData | null = null;
      if (body.data !== undefined) {
        data = parseBudgetData(body.data);
        if (!data) fields.data = 'invalid';
      }
      if (body.baseUpdatedAt !== undefined && typeof body.baseUpdatedAt !== 'string') fields.baseUpdatedAt = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      if (typeof body.baseUpdatedAt === 'string' && body.baseUpdatedAt !== current.updatedAt.toISOString()) {
        return reply.code(409).send({ error: 'conflict', current: await dto(current, true) });
      }

      const changed: string[] = [];
      if (name !== current.name) changed.push('name');
      if (data && JSON.stringify(data) !== JSON.stringify({ ...emptyBudget(), ...(current.data as object) })) changed.push('data');
      if (!changed.length) return dto(current, true);

      const totalCents = data ? budgetHeadlineCents(data) : current.totalCents;
      const actor = request.user!;
      const updated = await db.transaction(async (tx) => {
        const [b] = await tx
          .update(budgets)
          .set({
            name,
            ...(data ? { data: data as unknown as Record<string, unknown> } : {}),
            totalCents,
            updatedAt: new Date(),
          })
          .where(eq(budgets.id, current.id))
          .returning();
        await audit(tx, {
          userId: actor.id,
          action: 'budget.update',
          entity: 'budget',
          entityId: current.id,
          // Só o que mudou e o total; o conteúdo do orçamento não é copiado para o histórico.
          payload: {
            changed,
            ...(changed.includes('name') ? { name: { from: current.name, to: name } } : {}),
            totalCents: { from: current.totalCents, to: totalCents },
          },
        });
        return b;
      });
      return dto(updated, true);
    },
  );
}
