// Fase 6a, antes da publicação: o gerador de PDF e as folhas (src/budget/BudgetSheets.tsx) só são carregados
// quando a rota de PDF é chamada. Aqui os dois módulos são trocados por versões que quebram ao carregar,
// como se a Vercel não conseguisse compilá-los: login, projetos e orçamentos precisam continuar funcionando,
// e só o "Salvar em PDF" responde erro. Banco em memória (PGlite), Google e Drive simulados.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, lazyPdfRenderer, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { randomToken } from '../api/_app/crypto.js';
import { createGoogleClient } from '../api/_app/google.js';
import { emptyBudget } from '../src/shared/budget-calc.js';
import { FakeDrive } from './fake-drive.js';
import { FakeCalendar } from './fake-calendar.js';

const loaded = vi.hoisted(() => ({ pdf: 0, sheets: 0 }));
vi.mock('../api/_app/budget-pdf.js', () => {
  loaded.pdf++;
  throw new Error('módulo do PDF quebrado (simulado)');
});
vi.mock('../src/budget/BudgetSheets.js', () => {
  loaded.sheets++;
  throw new Error('folhas quebradas (simulado)');
});

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
const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'k1', alg: 'RS256' }] });
let nextIdToken = '';

let app: FastifyInstance;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  const google = createGoogleClient({
    clientId: CLIENT_ID,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleRedirectUri,
    jwks,
    fetch: async () => new Response(JSON.stringify({ id_token: nextIdToken, refresh_token: 'refresh-teste' }), { status: 200 }),
  });
  // Sem `pdf`: a API usa o gerador de verdade, carregado sob demanda.
  app = await buildApp({ config, db: pgDb as unknown as Db, google, drive: new FakeDrive(), calendar: new FakeCalendar() });
});

afterEach(async () => {
  await app.close();
});

/** Fluxo completo de login: /auth/google → Google (simulado) → /auth/google/callback. */
async function login(): Promise<{ cookie: string }> {
  const start = await app.inject({ method: 'GET', url: '/auth/google' });
  const state = new URL(start.headers.location as string).searchParams.get('state')!;
  nextIdToken = await new SignJWT({ email_verified: true, sub: 'sub-admin', email: ADMIN_EMAIL, name: 'Administradora Teste' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer('https://accounts.google.com')
    .setAudience(CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(keys.privateKey);
  const res = await app.inject({
    method: 'GET',
    url: `/auth/google/callback?code=codigo-teste&state=${encodeURIComponent(state)}`,
    headers: { cookie: start.cookies.map((c) => `${c.name}=${c.value}`).join('; ') },
  });
  expect(res.statusCode).toBe(302);
  const session = res.cookies.find((c) => c.name === SESSION_COOKIE)!;
  return { cookie: `${SESSION_COOKIE}=${session.value}` };
}

describe('API sem o gerador de PDF carregado', () => {
  it('login, projetos e orçamentos funcionam; o módulo do PDF e as folhas não são carregados', async () => {
    const headers = await login();
    expect((await app.inject({ method: 'GET', url: '/me', headers })).json()).toMatchObject({ email: ADMIN_EMAIL, role: 'admin' });

    const project = await app.inject({ method: 'POST', url: '/projects', headers, payload: { name: 'Apartamento Teste', clientName: 'Cliente Exemplo' } });
    expect(project.statusCode).toBe(201);
    expect((await app.inject({ method: 'GET', url: '/projects', headers })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: `/projects/${project.json().id}/page`, headers })).statusCode).toBe(200);

    const created = await app.inject({ method: 'POST', url: '/budgets', headers, payload: { name: 'Sala', projectId: project.json().id } });
    expect(created.statusCode).toBe(201);
    const saved = await app.inject({
      method: 'PATCH',
      url: `/budgets/${created.json().id}`,
      headers,
      payload: { data: { ...emptyBudget(), cliente: 'Cliente Exemplo', ambientes: [{ nome: 'Sala', valor: 500 }] } },
    });
    expect(saved.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/budgets', headers })).json()).toHaveLength(1);
    expect((await app.inject({ method: 'GET', url: `/budgets/${created.json().id}`, headers })).statusCode).toBe(200);

    expect(loaded).toEqual({ pdf: 0, sheets: 0 });
  });

  it('só o "Salvar em PDF" falha (502), e a API segue respondendo depois', async () => {
    const headers = await login();
    const created = (await app.inject({ method: 'POST', url: '/budgets', headers, payload: { name: 'Avulso' } })).json();
    const res = await app.inject({ method: 'POST', url: `/budgets/${created.id}/pdf`, headers });
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'pdf_failed' });
    expect(loaded.pdf).toBeGreaterThan(0);
    // A versão reservada foi devolvida e nada ficou gravado.
    const after = (await app.inject({ method: 'GET', url: `/budgets/${created.id}`, headers })).json();
    expect(after.pdf).toBeNull();
    expect((await app.inject({ method: 'GET', url: '/me', headers })).statusCode).toBe(200);
  });
});

describe('carregamento sob demanda', () => {
  it('carrega uma vez só; depois de uma falha ao carregar, tenta de novo no pedido seguinte', async () => {
    const render = vi.fn(async () => ({ pdf: new Uint8Array([37]), pages: 1, limits: [] }));
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('falha ao carregar'))
      .mockResolvedValue({ createPdfRenderer: () => ({ render }) });
    const pdf = lazyPdfRenderer(undefined, load);
    expect(load).not.toHaveBeenCalled();
    await expect(pdf.render(emptyBudget())).rejects.toThrow('falha ao carregar');
    await pdf.render(emptyBudget());
    await pdf.render(emptyBudget());
    expect(load).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledTimes(2);
  });
});
