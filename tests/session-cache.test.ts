// Cache curto da busca de sessão: evita uma ida ao banco por requisição sem deixar passar sessão
// vencida, revogada, encerrada ou com papel antigo. Banco em memória (PGlite).
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession, getSessionUser, SESSION_CACHE_MS, SESSION_TTL_MS } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import { FakeDrive } from './fake-drive.js';

const ADMIN_EMAIL = 'admin@decroqui.test';
const config: Config = {
  databaseUrl: 'pglite://memory',
  googleClientId: 'test',
  googleClientSecret: 'test',
  googleRedirectUri: 'http://localhost:3001/auth/google/callback',
  sessionSecret: randomToken(32),
  adminEmail: ADMIN_EMAIL,
  tokenEncryptionKey: Buffer.alloc(32, 7),
  appUrl: 'http://localhost:5173',
  secureCookies: false,
};

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  app = await buildApp({ config, db, drive: new FakeDrive() });
});

afterEach(async () => {
  vi.useRealTimers();
  await app.close();
});

async function person(role: 'member' | 'viewer') {
  const [user] = await db
    .insert(schema.users)
    .values({ email: `${role}-${randomToken(4)}@decroqui.test`, name: `Pessoa ${role}`, role, status: 'active' })
    .returning();
  const { token } = await createSession(db, user.id);
  return { user, token, headers: { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` } };
}

async function adminHeaders() {
  const [admin] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  const { token } = await createSession(db, admin.id);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

describe('cache da sessão', () => {
  it('dentro do prazo do cache não consulta o banco de novo', async () => {
    const { user, token } = await person('member');
    const now = new Date();
    expect((await getSessionUser(db, token, now))?.id).toBe(user.id);
    const select = vi.spyOn(db, 'select');
    expect((await getSessionUser(db, token, new Date(now.getTime() + 1000)))?.id).toBe(user.id);
    expect(select).not.toHaveBeenCalled();
    select.mockRestore();
  });

  it('sessão revogada direto no banco é recusada quando o cache vence', async () => {
    const { token } = await person('member');
    const now = new Date();
    expect(await getSessionUser(db, token, now)).not.toBeNull();
    await db.delete(schema.sessions);
    // Ainda dentro dos 30 s, esta instância usa o que conferiu; passado o prazo, consulta e recusa.
    expect(await getSessionUser(db, token, new Date(now.getTime() + SESSION_CACHE_MS - 1))).not.toBeNull();
    expect(await getSessionUser(db, token, new Date(now.getTime() + SESSION_CACHE_MS))).toBeNull();
  });

  it('sessão que vence durante o prazo do cache é recusada na hora e apagada', async () => {
    const [u] = await db.insert(schema.users).values({ email: 'quase@decroqui.test', role: 'member', status: 'active' }).returning();
    // Criada há quase 7 dias: vence daqui a 10 s.
    const createdAt = Date.now() - SESSION_TTL_MS + 10_000;
    const { token } = await createSession(db, u.id, createdAt);
    const now = new Date();
    expect(await getSessionUser(db, token, now)).not.toBeNull();
    expect(await getSessionUser(db, token, new Date(now.getTime() + 11_000))).toBeNull();
    expect(await db.select().from(schema.sessions)).toHaveLength(0);
  });

  it('sair encerra a sessão na hora, mesmo com ela no cache', async () => {
    const { headers } = await person('member');
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/auth/logout', headers })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(401);
  });

  it('troca de papel vale na próxima requisição', async () => {
    const admin = await adminHeaders();
    const { user, headers } = await person('member');
    expect((await app.inject({ method: 'GET', url: '/me', headers })).json().role).toBe('member');
    const changed = await app.inject({ method: 'PATCH', url: `/users/${user.id}/role`, headers: admin, payload: { role: 'viewer' } });
    expect(changed.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/me', headers })).json().role).toBe('viewer');
    // Leitor não cria projeto: a permissão segue o papel novo, não o do cache.
    const create = await app.inject({ method: 'POST', url: '/projects', headers, payload: { name: 'Teste', clientName: 'Cliente' } });
    expect(create.statusCode).toBe(403);
  });

  it('conta desativada perde o acesso na hora', async () => {
    const admin = await adminHeaders();
    const { user, headers } = await person('member');
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/users/${user.id}/disable`, headers: admin })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(401);
  });
});
