import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { sessions, userRole, users, type User, type UserRole } from '../db/schema.js';
import { audit } from '../audit.js';
import { forgetUserSessions } from '../auth.js';
import { ensureRootFolder, type DriveClient } from '../drive.js';
import { notifyAdmins } from '../notifications-service.js';

const ROLES = userRole.enumValues;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Acesso à pasta "De.Croqui ERP" no Drive, sempre como leitor:
 * owner: é a conta dona dos arquivos; reader: compartilhada; missing: devia ter e não tem (falhou ou é anterior à Fase 3c);
 * revoke_pending: desativado, mas a revogação falhou; none: desativado e sem acesso.
 */
export type DriveAccess = 'owner' | 'reader' | 'missing' | 'revoke_pending' | 'none';

function driveAccess(u: User, adminEmail: string): DriveAccess {
  if (u.email === adminEmail) return 'owner';
  if (u.status === 'disabled') return u.drivePermissionId ? 'revoke_pending' : 'none';
  return u.drivePermissionId ? 'reader' : 'missing';
}

export function toUserDto(u: User, adminEmail: string) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    driveAccess: driveAccess(u, adminEmail),
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

export async function usersRoutes(app: FastifyInstance, { db, drive, adminEmail }: { db: Db; drive: DriveClient; adminEmail: string }) {
  const dto = (u: User) => toUserDto(u, adminEmail);

  /** Compartilha a pasta raiz como leitor e guarda o ID da permissão. Devolve o usuário atualizado, ou null se o Drive falhou. */
  async function grantDrive(u: User, actorId: string, request: FastifyRequest): Promise<User | null> {
    try {
      const rootId = await ensureRootFolder(db, drive);
      const permissionId = await drive.shareReader(rootId, u.email);
      const [updated] = await db.update(users).set({ drivePermissionId: permissionId }).where(eq(users.id, u.id)).returning();
      await audit(db, { userId: actorId, action: 'drive.share', entity: 'user', entityId: u.id, payload: { email: u.email, role: 'reader', permissionId } });
      return updated;
    } catch (err) {
      request.log.error({ err: (err as Error)?.message ?? err }, 'falha ao compartilhar a pasta do Drive');
      return null;
    }
  }

  /** Revoga só a permissão guardada. Devolve o usuário atualizado, ou null se o Drive falhou. */
  async function revokeDrive(u: User, actorId: string, request: FastifyRequest): Promise<User | null> {
    if (!u.drivePermissionId) return u;
    try {
      const rootId = await ensureRootFolder(db, drive);
      await drive.revokePermission(rootId, u.drivePermissionId);
      const [updated] = await db.update(users).set({ drivePermissionId: null }).where(eq(users.id, u.id)).returning();
      await audit(db, { userId: actorId, action: 'drive.revoke', entity: 'user', entityId: u.id, payload: { email: u.email, permissionId: u.drivePermissionId } });
      return updated ?? u;
    } catch (err) {
      request.log.error({ err: (err as Error)?.message ?? err }, 'falha ao revogar o acesso ao Drive');
      return null;
    }
  }

  function driveFailedNotice(u: User, what: 'share' | 'revoke') {
    return {
      type: 'drive.failed' as const,
      title: what === 'share' ? 'Compartilhamento do Drive falhou' : 'Revogação no Drive falhou',
      body:
        what === 'share'
          ? `Não foi possível compartilhar a pasta De.Croqui ERP com ${u.email}. O convite está salvo. Tente de novo em Colaboradores.`
          : `Não foi possível tirar o acesso de ${u.email} à pasta De.Croqui ERP. Tente de novo em Colaboradores.`,
      link: '/colaboradores',
    };
  }

  app.get('/users', { config: { permission: 'users.read' } }, async () => {
    const rows = await db.select().from(users).orderBy(asc(users.createdAt));
    return rows.map(dto);
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
      // O convite fica salvo mesmo se o Drive falhar; a administração recebe o aviso para tentar de novo.
      const shared = await grantDrive(created, request.user!.id, request);
      if (!shared) await notifyAdmins(db, driveFailedNotice(created, 'share'));
      return reply.code(201).send(dto(shared ?? created));
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
        // O papel novo vale já na próxima requisição desta pessoa.
        forgetUserSessions(db, updated.id);
        return dto(updated);
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
        forgetUserSessions(db, updated.id);
        // A conta já está desativada no ERP; se o Drive falhar, a administração recebe o aviso para tentar de novo.
        const revoked = await revokeDrive(updated, actor.id, request);
        if (!revoked) await notifyAdmins(db, driveFailedNotice(updated, 'revoke'));
        return dto(revoked ?? updated);
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

      // Revoga antes de apagar o registro, que guarda o ID da permissão. Se o Drive falhar, nada é removido.
      const [current] = UUID_RE.test(request.params.id) ? await db.select().from(users).where(eq(users.id, request.params.id)) : [];
      if (current && current.status !== 'active' && current.drivePermissionId) {
        if (!(await revokeDrive(current, actor.id, request))) return reply.code(502).send({ error: 'drive_failed' });
      }

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
        forgetUserSessions(db, request.params.id);
        return reply.code(204).send();
      } catch (err) {
        return sendConflict(reply, err);
      }
    },
  );

  /** Tenta de novo a parte do Drive que falhou: compartilhar (convidado ou ativo) ou revogar (desativado). */
  app.post<{ Params: { id: string } }>(
    '/users/:id/drive-access',
    { config: { permission: 'users.manage' } },
    async (request, reply) => {
      const [target] = UUID_RE.test(request.params.id) ? await db.select().from(users).where(eq(users.id, request.params.id)) : [];
      if (!target) return reply.code(404).send({ error: 'not_found' });
      const access = driveAccess(target, adminEmail);
      if (access === 'missing') {
        const shared = await grantDrive(target, request.user!.id, request);
        return shared ? dto(shared) : reply.code(502).send({ error: 'drive_failed' });
      }
      if (access === 'revoke_pending') {
        const revoked = await revokeDrive(target, request.user!.id, request);
        return revoked ? dto(revoked) : reply.code(502).send({ error: 'drive_failed' });
      }
      return dto(target);
    },
  );
}
