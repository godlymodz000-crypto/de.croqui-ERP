// Junto com a página pública /privacidade: a API continua recusando quem não tem sessão.
// Fica em arquivo separado porque o teste da tela simula window, e o PGlite não roda assim.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { randomToken } from '../api/_app/crypto.js';
import { createGoogleClient } from '../api/_app/google.js';

describe('rotas protegidas da API sem sessão', () => {
  const config: Config = {
    databaseUrl: 'pglite://memory',
    googleClientId: 'test-client.apps.googleusercontent.com',
    googleClientSecret: 'segredo-de-teste',
    googleRedirectUri: 'http://localhost:3001/auth/google/callback',
    sessionSecret: randomToken(32),
    adminEmail: 'admin@decroqui.test',
    tokenEncryptionKey: Buffer.alloc(32, 7),
    appUrl: 'http://localhost:5173',
    secureCookies: false,
  };
  let app: FastifyInstance;

  beforeAll(async () => {
    const pg = new PGlite();
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: './drizzle' });
    const google = createGoogleClient({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      redirectUri: config.googleRedirectUri,
      fetch: async () => new Response('{}', { status: 500 }),
    });
    app = await buildApp({ config, db: db as unknown as Db, google });
  });

  afterAll(async () => {
    await app?.close();
  });

  const PROTECTED: [string, string][] = [
    ['GET', '/me'],
    ['GET', '/users'],
    ['GET', '/projects'],
    ['GET', '/board'],
    ['GET', '/events'],
    ['GET', '/notifications'],
    ['GET', '/deletion-requests'],
    ['GET', '/broadcasts'],
    ['POST', '/calendar/connect'],
  ];

  it('a API responde 401 sem sessão e com sessão inventada', async () => {
    for (const [method, url] of PROTECTED) {
      const none = await app.inject({ method: method as 'GET', url });
      expect(none.statusCode, `${method} ${url}`).toBe(401);
      const forged = await app.inject({ method: method as 'GET', url, headers: { cookie: `${SESSION_COOKIE}=inventado` } });
      expect(forged.statusCode, `${method} ${url} com sessão inventada`).toBe(401);
    }
  });
});
