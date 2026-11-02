// Testes de aceite da Fase 1 (ESPECIFICACAO.md, seção 12), contra um Postgres em memória (PGlite)
// e um Google simulado: o ID token é assinado com uma chave RSA local e validado pelo mesmo código de produção.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { decrypt, randomToken } from '../api/_app/crypto.js';
import { createGoogleClient } from '../api/_app/google.js';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const ADMIN_EMAIL = 'admin@decroqui.test';

const config: Config = {
  databaseUrl: 'pglite://memory',
  googleClientId: CLIENT_ID,
  googleClientSecret: 'segredo-de-teste',
  googleRedirectUri: 'http://localhost:3001/auth/google/callback',
  sessionSecret: randomToken(32),
  adminEmail: ADMIN_EMAIL,
  tokenEncryptionKey: Buffer.alloc(32, 7),
  appUrl: 'http://localhost:5173',
  secureCookies: false,
};

const keys = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(keys.publicKey)), kid: 'k1', alg: 'RS256' };
const jwks = createLocalJWKSet({ keys: [jwk] });

function idToken(claims: JWTPayload, opts: { exp?: string | number; aud?: string; iss?: string } = {}) {
  return new SignJWT({ email_verified: true, ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(opts.iss ?? 'https://accounts.google.com')
    .setAudience(opts.aud ?? CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? '1h')
    .sign(keys.privateKey);
}

let db: Db;
let app: FastifyInstance;
let nextTokenResponse: { id_token: string; refresh_token?: string };
let lastTokenRequest: URLSearchParams | null;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  lastTokenRequest = null;
  const google = createGoogleClient({
    clientId: CLIENT_ID,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleRedirectUri,
    jwks,
    fetch: async (_url, init) => {
      lastTokenRequest = new URLSearchParams(String(init?.body));
      return new Response(JSON.stringify(nextTokenResponse), { status: 200 });
    },
  });
  app = await buildApp({ config, db, google });
});

afterEach(async () => {
  await app.close();
});

function cookieHeader(res: { cookies: { name: string; value: string }[] }) {
  return res.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

/** Percorre o fluxo inteiro: /auth/google → Google (simulado) → /auth/google/callback. */
async function login(claims: JWTPayload, tokenOpts?: Parameters<typeof idToken>[1], refreshToken?: string) {
  const start = await app.inject({ method: 'GET', url: '/auth/google' });
  const location = new URL(start.headers.location as string);
  const state = location.searchParams.get('state')!;
  nextTokenResponse = { id_token: await idToken(claims, tokenOpts), refresh_token: refreshToken };
  return app.inject({
    method: 'GET',
    url: `/auth/google/callback?code=codigo-teste&state=${encodeURIComponent(state)}`,
    headers: { cookie: cookieHeader(start) },
  });
}

function sessionCookie(res: Awaited<ReturnType<typeof login>>) {
  return res.cookies.find((c) => c.name === SESSION_COOKIE);
}

describe('Fase 1 — critérios de aceite', () => {
  it('entrar com conta autorizada: o administrador de ADMIN_EMAIL entra e acessa a rota protegida', async () => {
    const res = await login({ sub: 'sub-admin', email: ADMIN_EMAIL, name: 'Marina Costa' }, undefined, 'refresh-123');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/');
    const cookie = sessionCookie(res);
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe('Lax');

    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie: `${SESSION_COOKIE}=${cookie!.value}` } });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email: ADMIN_EMAIL, role: 'admin', name: 'Marina Costa' });

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
    expect(user.googleSub).toBe('sub-admin');
    expect(user.status).toBe('active');
    expect(user.lastLoginAt).not.toBeNull();
    // Token do Google criptografado no banco, nunca em texto puro.
    expect(user.googleRefreshToken).not.toContain('refresh-123');
    expect(decrypt(user.googleRefreshToken!, config.tokenEncryptionKey)).toBe('refresh-123');
  });

  it('conta não autorizada vê a mensagem e nenhuma conta é criada', async () => {
    const res = await login({ sub: 'sub-estranho', email: 'alguem@gmail.com' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/entrar?erro=sem-acesso');
    expect(sessionCookie(res)?.value ?? '').toBe('');
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, 'alguem@gmail.com'));
    expect(rows).toHaveLength(0);
  });

  it('sessão expira: depois de expires_at a rota protegida responde 401 e a sessão é apagada', async () => {
    const res = await login({ sub: 'sub-admin', email: ADMIN_EMAIL });
    const cookie = sessionCookie(res)!;
    expect(cookie.maxAge).toBe(7 * 24 * 60 * 60);
    const headers = { cookie: `${SESSION_COOKIE}=${cookie.value}` };
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(200);

    await db.update(schema.sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    const expired = await app.inject({ method: 'GET', url: '/me', headers });
    expect(expired.statusCode).toBe(401);
    expect(await db.select().from(schema.sessions)).toHaveLength(0);
  });

  it('rota protegida recusa acesso sem sessão', async () => {
    const none = await app.inject({ method: 'GET', url: '/me' });
    expect(none.statusCode).toBe(401);
    const forged = await app.inject({ method: 'GET', url: '/me', headers: { cookie: `${SESSION_COOKIE}=inventado` } });
    expect(forged.statusCode).toBe(401);
  });
});

describe('Fase 1 — detalhes da seção 6', () => {
  it('redireciona ao Google com state, PKCE S256 e os escopos de login, Agenda e Drive', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/google' });
    const url = new URL(res.headers.location as string);
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('scope')!.split(' ')).toEqual([
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
    ]);
  });

  it('envia o code_verifier na troca do código', async () => {
    await login({ sub: 'sub-admin', email: ADMIN_EMAIL });
    expect(lastTokenRequest?.get('code_verifier')?.length).toBeGreaterThanOrEqual(43);
  });

  it('recusa state diferente do gerado', async () => {
    const start = await app.inject({ method: 'GET', url: '/auth/google' });
    nextTokenResponse = { id_token: await idToken({ sub: 'sub-admin', email: ADMIN_EMAIL }) };
    const res = await app.inject({
      method: 'GET',
      url: '/auth/google/callback?code=x&state=outro',
      headers: { cookie: cookieHeader(start) },
    });
    expect(res.headers.location).toBe('http://localhost:5173/entrar?erro=falha');
    expect(lastTokenRequest).toBeNull();
  });

  it.each([
    ['email_verified falso', { email_verified: false }, {}],
    ['aud de outro cliente', {}, { aud: 'outro-cliente' }],
    ['iss diferente do Google', {}, { iss: 'https://evil.example' }],
    ['token expirado', {}, { exp: Math.floor(Date.now() / 1000) - 60 }],
  ])('recusa ID token com %s', async (_label, claims, opts) => {
    const res = await login({ sub: 'sub-admin', email: ADMIN_EMAIL, ...claims }, opts);
    expect(res.headers.location).toBe('http://localhost:5173/entrar?erro=falha');
    expect(sessionCookie(res)?.value ?? '').toBe('');
  });

  it('convidado vira active no primeiro login e grava o google_sub', async () => {
    await db.insert(schema.users).values({ email: 'ana@decroqui.test', name: 'Ana', role: 'member' });
    const res = await login({ sub: 'sub-ana', email: 'ana@decroqui.test' });
    expect(res.headers.location).toBe('http://localhost:5173/');
    const [ana] = await db.select().from(schema.users).where(eq(schema.users.email, 'ana@decroqui.test'));
    expect(ana).toMatchObject({ status: 'active', googleSub: 'sub-ana', role: 'member' });
  });

  it('conta desativada não entra, e a sessão aberta termina no próximo acesso', async () => {
    const res = await login({ sub: 'sub-admin', email: ADMIN_EMAIL });
    const headers = { cookie: `${SESSION_COOKIE}=${sessionCookie(res)!.value}` };
    await db.update(schema.users).set({ status: 'disabled' });
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(401);
    const again = await login({ sub: 'sub-admin', email: ADMIN_EMAIL });
    expect(again.headers.location).toBe('http://localhost:5173/entrar?erro=sem-acesso');
  });

  it('sair apaga a sessão', async () => {
    const res = await login({ sub: 'sub-admin', email: ADMIN_EMAIL });
    const headers = { cookie: `${SESSION_COOKIE}=${sessionCookie(res)!.value}` };
    expect((await app.inject({ method: 'POST', url: '/auth/logout', headers })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(401);
  });

  it('cria o administrador uma única vez', async () => {
    const admins = await db.select().from(schema.users).where(eq(schema.users.role, 'admin'));
    expect(admins).toHaveLength(1);
    expect(admins[0]).toMatchObject({ email: ADMIN_EMAIL, status: 'active' });
  });
});
