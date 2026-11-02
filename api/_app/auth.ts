import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { sessions, users, type User } from './db/schema.js';
import { encrypt, randomToken, sha256 } from './crypto.js';
import type { GoogleIdentity } from './google.js';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Na primeira execução, sem nenhum administrador, cria (ou promove) a conta de ADMIN_EMAIL. */
export async function ensureAdmin(db: Db, adminEmail: string): Promise<void> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
  if (existing) return;
  await db
    .insert(users)
    .values({ email: adminEmail, role: 'admin', status: 'active' })
    .onConflictDoUpdate({ target: users.email, set: { role: 'admin', status: 'active' } });
}

/**
 * Seção 6, passo 4: procura pelo google_sub; se não achar, pela conta ainda não vinculada com o mesmo e-mail.
 * Retorna null quando a conta não está autorizada. Nunca cria usuário.
 */
export async function resolveAuthorizedUser(db: Db, identity: GoogleIdentity): Promise<User | null> {
  const [bySub] = await db.select().from(users).where(eq(users.googleSub, identity.sub)).limit(1);
  if (bySub) return bySub.status === 'active' ? bySub : null;

  // Convidados (invited) e o administrador criado na primeira execução (active, ainda sem google_sub).
  const [byEmail] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, identity.email), isNull(users.googleSub), ne(users.status, 'disabled')))
    .limit(1);
  if (!byEmail) return null;

  const [linked] = await db
    .update(users)
    .set({ googleSub: identity.sub, status: 'active' })
    .where(eq(users.id, byEmail.id))
    .returning();
  return linked ?? null;
}

export async function recordLogin(
  db: Db,
  user: User,
  identity: GoogleIdentity,
  refreshToken: string | null,
  encryptionKey: Buffer,
): Promise<void> {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      name: user.name ?? identity.name,
      ...(refreshToken ? { googleRefreshToken: encrypt(refreshToken, encryptionKey) } : {}),
    })
    .where(eq(users.id, user.id));
}

/** Cria a sessão e devolve o token para o cookie. No banco fica só o hash. */
export async function createSession(db: Db, userId: string, now = Date.now()): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(now + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  return { token, expiresAt };
}

/** Sessão válida só se não expirou e se o usuário continua ativo. Caso contrário, é apagada. */
export async function getSessionUser(db: Db, token: string, now = new Date()): Promise<User | null> {
  const id = sha256(token);
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt <= now || row.user.status !== 'active') {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return row.user;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

export async function deleteExpiredSessions(db: Db): Promise<void> {
  await db.delete(sessions).where(sql`${sessions.expiresAt} <= now()`);
}
