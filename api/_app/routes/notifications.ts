import type { FastifyInstance } from 'fastify';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { notifications } from '../db/schema.js';
import { can } from '../permissions.js';
import { pendingRequestCount } from '../notifications-service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Quantas aparecem na lista do sino. */
const LIST_SIZE = 20;

/** Notificações de quem está conectado. Toda consulta filtra pelo próprio usuário; a de outra pessoa responde 404. */
export async function notificationsRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/notifications', { config: { permission: 'notifications.own' } }, async (request) => {
    const me = request.user!;
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, me.id))
      .orderBy(desc(notifications.createdAt))
      .limit(LIST_SIZE);
    const [unread] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
    return {
      items: items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, readAt: n.readAt, createdAt: n.createdAt })),
      unread: Number(unread?.n ?? 0),
      // Contador do item "Pedidos de exclusão" no menu do avatar; só para quem decide os pedidos.
      pendingDeletionRequests: can(me.role, 'deletion.decide') ? await pendingRequestCount(db) : null,
    };
  });

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
}
