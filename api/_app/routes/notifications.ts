import type { FastifyInstance } from 'fastify';
import { and, count, desc, eq, inArray, isNull, ne, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Db } from '../db/client.js';
import { broadcasts, notifications, projects, users, type BroadcastAudience, type NotificationType, type User } from '../db/schema.js';
import { can } from '../permissions.js';
import { audit } from '../audit.js';
import { pendingRequestCount } from '../notifications-service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Itens por página, na página de Notificações e em Comunicados enviados. O sino pede menos. */
const PAGE_SIZE = 20;
const TITLE_MAX = 120;
const BODY_MAX = 1000;

/** Filtro por tipo da página: cada opção do seletor junta um ou mais tipos. */
const TYPE_GROUPS: Record<string, NotificationType[]> = {
  requests: ['deletion.requested', 'deletion.approved', 'deletion.rejected'],
  announcements: ['announcement'],
  drive: ['drive.failed'],
};
const AUDIENCES: BroadcastAudience[] = ['all', 'members', 'viewers', 'people'];

/** Telas que um comunicado pode abrir. As de administração só valem quando todos os destinatários são administradores. */
const PAGES: Record<string, { path: string; adminOnly?: boolean }> = {
  projetos: { path: '/projetos' },
  agenda: { path: '/agenda' },
  processos: { path: '/processos' },
  orcamentos: { path: '/orcamentos' },
  apresentacoes: { path: '/apresentacoes' },
  'pedidos-de-exclusao': { path: '/pedidos-de-exclusao', adminOnly: true },
  colaboradores: { path: '/colaboradores', adminOnly: true },
};

type LinkInput = { kind?: unknown; projectId?: unknown; page?: unknown } | null | undefined;
interface BroadcastBody {
  audience?: unknown;
  userIds?: unknown;
  title?: unknown;
  body?: unknown;
  link?: LinkInput;
}

/** Notificações de quem está conectado e comunicados da administração. Toda leitura filtra pelo próprio usuário. */
export async function notificationsRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const sender = alias(users, 'sender');

  app.get<{ Querystring: { view?: string; type?: string; page?: string; limit?: string } }>(
    '/notifications',
    { config: { permission: 'notifications.own' } },
    async (request, reply) => {
      const me = request.user!;
      const { view = 'all', type = 'all', page: pageRaw = '1', limit: limitRaw = String(PAGE_SIZE) } = request.query;
      const page = Number(pageRaw);
      const limit = Number(limitRaw);
      const fields: Record<string, string> = {};
      if (view !== 'all' && view !== 'unread') fields.view = 'invalid';
      if (type !== 'all' && !TYPE_GROUPS[type]) fields.type = 'invalid';
      if (!Number.isInteger(page) || page < 1) fields.page = 'invalid';
      if (!Number.isInteger(limit) || limit < 1 || limit > PAGE_SIZE) fields.limit = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      const where: SQL[] = [eq(notifications.userId, me.id)];
      if (view === 'unread') where.push(isNull(notifications.readAt));
      if (type !== 'all') where.push(inArray(notifications.type, TYPE_GROUPS[type]));

      const rows = await db
        .select({ n: notifications, senderName: sql<string | null>`coalesce(${sender.name}, ${sender.email})` })
        .from(notifications)
        .leftJoin(sender, eq(sender.id, notifications.senderUserId))
        .where(and(...where))
        .orderBy(desc(notifications.createdAt), desc(notifications.id))
        .limit(limit)
        .offset((page - 1) * limit);
      const [total] = await db.select({ n: count() }).from(notifications).where(and(...where));
      const [unread] = await db
        .select({ n: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
      return {
        items: rows.map(({ n, senderName }) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          senderName: n.type === 'announcement' ? senderName : null,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
        unread: Number(unread?.n ?? 0),
        total: Number(total?.n ?? 0),
        page,
        pageSize: limit,
        // Contador do item "Pedidos de exclusão" no menu do avatar; só para quem decide os pedidos.
        pendingDeletionRequests: can(me.role, 'deletion.decide') ? await pendingRequestCount(db) : null,
      };
    },
  );

  app.post<{ Params: { id: string } }>('/notifications/:id/read', { config: { permission: 'notifications.own' } }, async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.code(404).send({ error: 'not_found' });
    const [n] = await db
      .update(notifications)
      .set({ readAt: sql`coalesce(${notifications.readAt}, now())` })
      .where(and(eq(notifications.id, request.params.id), eq(notifications.userId, request.user!.id)))
      .returning({ id: notifications.id });
    if (!n) return reply.code(404).send({ error: 'not_found' });
    return reply.code(204).send();
  });

  app.post('/notifications/read-all', { config: { permission: 'notifications.own' } }, async (request, reply) => {
    await db
      .update(notifications)
      .set({ readAt: sql`now()` })
      .where(and(eq(notifications.userId, request.user!.id), isNull(notifications.readAt)));
    return reply.code(204).send();
  });

  /** Contas ativas para o painel de envio: a lista de "Pessoas específicas" e a contagem de cada grupo. */
  app.get('/broadcasts/audience', { config: { permission: 'notifications.send' } }, async (request) => {
    const me = request.user!;
    const active = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(sql`lower(coalesce(${users.name}, ${users.email}))`);
    const others = active.filter((u) => u.id !== me.id);
    return {
      people: active.map((u) => ({ id: u.id, name: u.name ?? u.email, role: u.role, me: u.id === me.id })),
      counts: {
        all: others.length,
        members: others.filter((u) => u.role === 'member').length,
        viewers: others.filter((u) => u.role === 'viewer').length,
      },
    };
  });

  app.post<{ Body: BroadcastBody }>('/broadcasts', { config: { permission: 'notifications.send' } }, async (request, reply) => {
    const me = request.user!;
    const input = request.body ?? {};
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const body = typeof input.body === 'string' ? input.body.trim() : '';
    const audience = input.audience as BroadcastAudience;
    const fields: Record<string, string> = {};
    if (!title) fields.title = 'required';
    else if (title.length > TITLE_MAX) fields.title = 'too_long';
    if (!body) fields.body = 'required';
    else if (body.length > BODY_MAX) fields.body = 'too_long';
    if (!AUDIENCES.includes(audience)) fields.audience = 'invalid';

    // Destinatários: só contas ativas. Em "todos" e nos grupos, quem envia fica de fora; em pessoas escolhidas, recebe se se marcou.
    let recipients: Pick<User, 'id' | 'role'>[] = [];
    if (!fields.audience) {
      if (audience === 'people') {
        const ids = Array.isArray(input.userIds) ? [...new Set(input.userIds)] : null;
        if (!ids || ids.some((id) => typeof id !== 'string' || !UUID_RE.test(id))) fields.recipients = 'invalid';
        else if (!ids.length) fields.recipients = 'required';
        else {
          recipients = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(and(inArray(users.id, ids as string[]), eq(users.status, 'active')));
          if (recipients.length !== ids.length) fields.recipients = 'invalid';
        }
      } else {
        const role = audience === 'members' ? 'member' : audience === 'viewers' ? 'viewer' : null;
        recipients = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(and(eq(users.status, 'active'), ne(users.id, me.id), ...(role ? [eq(users.role, role)] : [])));
        if (!recipients.length) fields.recipients = 'none';
      }
    }

    // Link opcional: um projeto que existe ou uma tela do ERP que todos os destinatários podem abrir.
    let link: string | null = null;
    if (input.link != null) {
      const l = input.link;
      if (l.kind === 'project' && typeof l.projectId === 'string' && UUID_RE.test(l.projectId)) {
        const [p] = await db
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.id, l.projectId), isNull(projects.deletedAt)));
        if (p) link = `/projetos/${p.id}`;
        else fields.link = 'invalid';
      } else if (l.kind === 'page' && typeof l.page === 'string' && PAGES[l.page]) {
        const target = PAGES[l.page];
        if (target.adminOnly && recipients.some((r) => r.role !== 'admin')) fields.link = 'admin_only';
        else link = target.path;
      } else fields.link = 'invalid';
    }
    if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

    const created = await db.transaction(async (tx) => {
      const [b] = await tx.insert(broadcasts).values({ senderUserId: me.id, audience, title, body, link }).returning();
      await tx.insert(notifications).values(
        recipients.map((r) => ({ userId: r.id, type: 'announcement' as const, title, body, link, senderUserId: me.id, broadcastId: b.id })),
      );
      await audit(tx, {
        userId: me.id,
        action: 'broadcast.send',
        entity: 'broadcast',
        entityId: b.id,
        payload: { audience, title, link, recipients: recipients.length },
      });
      return b;
    });
    return reply.code(201).send({ id: created.id, recipientCount: recipients.length });
  });

  /** Comunicados enviados pela administração, com quantas pessoas receberam e quantas já leram. */
  app.get<{ Querystring: { page?: string } }>('/broadcasts', { config: { permission: 'notifications.send' } }, async (request, reply) => {
    const page = Number(request.query.page ?? '1');
    if (!Number.isInteger(page) || page < 1) return reply.code(400).send({ error: 'validation', fields: { page: 'invalid' } });
    const rows = await db
      .select({
        b: broadcasts,
        senderName: sql<string | null>`coalesce(${sender.name}, ${sender.email})`,
        recipientCount: sql<number>`(select count(*)::int from ${notifications} where ${notifications.broadcastId} = ${broadcasts.id})`,
        readCount: sql<number>`(select count(*)::int from ${notifications} where ${notifications.broadcastId} = ${broadcasts.id} and ${notifications.readAt} is not null)`,
      })
      .from(broadcasts)
      .leftJoin(sender, eq(sender.id, broadcasts.senderUserId))
      .orderBy(desc(broadcasts.createdAt), desc(broadcasts.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);
    const [total] = await db.select({ n: count() }).from(broadcasts);

    // Nomes de quem recebeu, só para os envios a pessoas escolhidas (coluna Destinatários).
    const peopleIds = rows.filter((r) => r.b.audience === 'people').map((r) => r.b.id);
    const names = new Map<string, string[]>();
    if (peopleIds.length) {
      const list = await db
        .select({ broadcastId: notifications.broadcastId, name: sql<string>`coalesce(${users.name}, ${users.email})` })
        .from(notifications)
        .innerJoin(users, eq(users.id, notifications.userId))
        .where(inArray(notifications.broadcastId, peopleIds))
        .orderBy(sql`lower(coalesce(${users.name}, ${users.email}))`);
      for (const r of list) names.set(r.broadcastId!, [...(names.get(r.broadcastId!) ?? []), r.name]);
    }

    return {
      items: rows.map((r) => ({
        id: r.b.id,
        title: r.b.title,
        body: r.b.body,
        link: r.b.link,
        audience: r.b.audience,
        recipients: r.b.audience === 'people' ? (names.get(r.b.id) ?? []) : null,
        senderName: r.senderName,
        recipientCount: Number(r.recipientCount),
        readCount: Number(r.readCount),
        createdAt: r.b.createdAt,
      })),
      total: Number(total?.n ?? 0),
      page,
      pageSize: PAGE_SIZE,
    };
  });
}
