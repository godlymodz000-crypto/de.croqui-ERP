import type { FastifyInstance, FastifyReply } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { sessions, userRole, users, type User, type UserRole } from '../db/schema.js';
import { audit } from '../audit.js';

const ROLES = userRole.enumValues;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export function toUserDto(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

class Conflict extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Trava as linhas dos administradores ativos e diz se `userId` é o único. */
async function isLastActiveAdmin(tx: Tx, userId: string): Promise<boolean> {
  const admins = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
    .for('update');
  return admins.length === 1 && admins[0].id === userId;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lockUser(tx: Tx, id: string): Promise<User | undefined> {
  if (!UUID_RE.test(id)) return undefined;
  const [u] = await tx.select().from(users).where(eq(users.id, id)).for('update');
  return u;
}

function sendConflict(reply: FastifyReply, err: unknown) {
  if (err instanceof Conflict) {
    return reply.code(err.code === 'not_found' ? 404 : 409).send({ error: err.code });
  }
  throw err;
}

export async function usersRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/users', { config: { permission: 'users.read' } }, async () => {
    const rows = await db.select().from(users).orderBy(asc(users.createdAt));
    return rows.map(toUserDto);
  });

  app.post<{ Body: { email?: unknown; name?: unknown; role?: unknown } }>(
    '/users',
    { config: { permission: 'users.manage' } },
    async (request, reply) => {
      const body = request.body ?? {};
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const role = body.role as UserRole;

      const fields: Record<string, string> = {};
      if (!email) fields.email = 'required';
      else if (!EMAIL_RE.test(email) || email.length > 254) fields.email = 'invalid';
      if (!name) fields.name = 'required';
      else if (name.length > 120) fields.name = 'too_long';
      if (!ROLES.includes(role)) fields.role = 'invalid';
      if (Object.keys(fields).length) return reply.code(400).send({ error: 'validation', fields });

      const [created] = await db
        .insert(users)
        .values({ email, name, role, status: 'invited' })
        .onConflictDoNothing({ target: users.email })
        .returning();
      if (!created) return reply.code(409).send({ error: 'email_taken', fields: { email: 'taken' } });

      await audit(db, {
        userId: request.user!.id,
        action: 'user.invite',
        entity: 'user',
        entityId: created.id,
        payload: { email, name, role },
      });
      return reply.code(201).send(toUserDto(created));
    },
  );

  app.patch<{ Params: { id: string }; Body: { role?: unknown } }>(
    '/users/:id/role',
    { config: { permission: 'users.manage' } },
    async (request, reply) => {
      const role = request.body?.role as UserRole;
      if (!ROLES.includes(role)) return reply.code(400).send({ error: 'validation', fields: { role: 'invalid' } });
      const actor = request.user!;
      if (request.params.id === actor.id) return reply.code(409).send({ error: 'self' });

      try {
        const updated = await db.transaction(async (tx) => {
          const target = await lockUser(tx, request.params.id);
          if (!target) throw new Conflict('not_found');
          if (target.role === role) return target;
          if (target.role === 'admin' && (await isLastActiveAdmin(tx, target.id))) throw new Conflict('last_admin');
          const [u] = await tx.update(users).set({ role }).where(eq(users.id, target.id)).returning();
          await audit(tx, {
            userId: actor.id,
            action: 'user.role_change',
            entity: 'user',
            entityId: target.id,
            payload: { email: target.email, from: target.role, to: role },
          });
          return u;
        });
        return toUserDto(updated);
      } catch (err) {
        return sendConflict(reply, err);
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    '/users/:id/disable',
    { config: { permission: 'users.manage' } },
    async (request, reply) => {
      const actor = request.user!;
      if (request.params.id === actor.id) return reply.code(409).send({ error: 'self' });

      try {
        const updated = await db.transaction(async (tx) => {
          const target = await lockUser(tx, request.params.id);
          if (!target) throw new Conflict('not_found');
          if (target.status === 'disabled') return target;
          if (target.role === 'admin' && (await isLastActiveAdmin(tx, target.id))) throw new Conflict('last_admin');
          const [u] = await tx.update(users).set({ status: 'disabled' }).where(eq(users.id, target.id)).returning();
          const ended = await tx.delete(sessions).where(eq(sessions.userId, target.id)).returning({ id: sessions.id });
          await audit(tx, {
            userId: actor.id,
            action: 'user.disable',
            entity: 'user',
            entityId: target.id,
            payload: { email: target.email, from: target.status, sessionsEnded: ended.length },
          });
          return u;
        });
        return toUserDto(updated);
      } catch (err) {
        return sendConflict(reply, err);
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/users/:id',
    { config: { permission: 'users.manage' } },
    async (request, reply) => {
      const actor = request.user!;
      if (request.params.id === actor.id) return reply.code(409).send({ error: 'self' });

      try {
        await db.transaction(async (tx) => {
          const target = await lockUser(tx, request.params.id);
          if (!target) throw new Conflict('not_found');
          // Só convidados ou desativados; uma conta ativa precisa ser desativada antes.
          if (target.status === 'active') throw new Conflict('invalid_status');
          await tx.delete(users).where(eq(users.id, target.id));
          await audit(tx, {
            userId: actor.id,
            action: 'user.remove',
            entity: 'user',
            entityId: target.id,
            payload: { email: target.email, name: target.name, role: target.role, status: target.status },
          });
        });
        return reply.code(204).send();
      } catch (err) {
        return sendConflict(reply, err);
      }
    },
  );
}
