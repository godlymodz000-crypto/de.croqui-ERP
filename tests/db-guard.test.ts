// Tempo máximo das consultas: uma conexão presa (como a de 3/11/2026, parada no meio da busca de sessão)
// precisa ser descartada e a requisição precisa responder 503 em poucos segundos, nunca em 300.
import { describe, expect, it, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import type postgres from 'postgres';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import { DbUnavailableError, guardClient, QUERY_TIMEOUT_MS, type Db, type SqlLike } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { randomToken } from '../api/_app/crypto.js';

const config: Config = {
  databaseUrl: 'postgres://teste',
  googleClientId: 'test',
  googleClientSecret: 'test',
  googleRedirectUri: 'http://localhost:3001/auth/google/callback',
  sessionSecret: randomToken(32),
  adminEmail: 'admin@decroqui.test',
  tokenEncryptionKey: Buffer.alloc(32, 7),
  appUrl: 'http://localhost:5173',
  secureCookies: false,
};

/** Cliente falso no formato do postgres.js. `hang` deixa toda consulta sem resposta, como a conexão presa. */
function fakeSql(opts: { hang?: boolean; fail?: unknown } = {}) {
  const calls: string[] = [];
  const cancels: number[] = [];
  const ends: unknown[] = [];
  const sql: SqlLike = {
    options: { parsers: {}, serializers: {} },
    unsafe(query: string) {
      calls.push(query);
      const q = {
        values: () => q,
        signal(signal: AbortSignal) {
          signal.addEventListener('abort', () => cancels.push(Date.now()));
          return q;
        },
        then(resolve?: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
          if (opts.fail) return Promise.reject(opts.fail).then(resolve, reject);
          if (opts.hang) return new Promise(() => {}).then(resolve, reject);
          return Promise.resolve([]).then(resolve, reject);
        },
      };
      return q as unknown as ReturnType<SqlLike['unsafe']>;
    },
    begin: () => (opts.hang ? new Promise(() => {}) : Promise.resolve([])),
    end(o) {
      ends.push(o);
      return Promise.resolve();
    },
  };
  return { sql, calls, cancels, ends };
}

describe('guarda das consultas', () => {
  it('consulta parada vira DbUnavailableError no tempo máximo e o cliente é trocado', async () => {
    const opened = [fakeSql({ hang: true }), fakeSql()];
    let i = 0;
    const { client, resets } = guardClient(() => opened[i++].sql, { query: 200, transaction: 400 });

    const started = Date.now();
    const err = await client.unsafe('select 1').then(() => null, (e) => e);
    expect(err).toBeInstanceOf(DbUnavailableError);
    expect(err.reason).toBe('timeout');
    expect(Date.now() - started).toBeLessThan(1000);
    // Pediu cancelamento no servidor antes do corte local e destruiu as conexões do cliente preso.
    expect(opened[0].cancels.length).toBe(1);
    expect(opened[0].ends).toEqual([{ timeout: 0 }]);
    expect(resets()).toBe(1);

    // A consulta seguinte vai para o cliente novo e responde.
    await expect(client.unsafe('select 2').values()).resolves.toEqual([]);
    expect(opened[1].calls).toEqual(['select 2']);
  });

  it('o cliente novo herda os parsers e serializers que o Drizzle registrou', async () => {
    const opened = [fakeSql({ hang: true }), fakeSql()];
    let i = 0;
    const { client } = guardClient(() => opened[i++].sql, { query: 50, transaction: 50 });
    client.options.parsers['1184'] = 'transparente';
    await client.unsafe('select 1').then(() => {}, () => {});
    expect(opened[1].sql.options.parsers['1184']).toBe('transparente');
  });

  it('transação parada também é cortada', async () => {
    const opened = [fakeSql({ hang: true }), fakeSql()];
    let i = 0;
    const { client, resets } = guardClient(() => opened[i++].sql, { query: 50, transaction: 150 });
    await expect(client.begin(async () => {})).rejects.toBeInstanceOf(DbUnavailableError);
    expect(resets()).toBe(1);
  });

  it('erro comum do banco passa como está; conexão caída vira DbUnavailableError', async () => {
    const unique = Object.assign(new Error('duplicate key'), { code: '23505' });
    const closed = Object.assign(new Error('closed'), { code: 'CONNECTION_CLOSED' });
    const a = guardClient(() => fakeSql({ fail: unique }).sql, { query: 500, transaction: 500 });
    await expect(a.client.unsafe('insert')).rejects.toBe(unique);
    const b = guardClient(() => fakeSql({ fail: closed }).sql, { query: 500, transaction: 500 });
    const err = await b.client.unsafe('select').then(() => null, (e) => e);
    expect(err).toBeInstanceOf(DbUnavailableError);
    expect(err.reason).toBe('connection');
    // Falha imediata não troca o cliente nem espera o tempo máximo.
    expect(a.resets() + b.resets()).toBe(0);
  });
});

describe('servidor com o banco travado', () => {
  it(
    'busca de sessão parada responde 503 em até 10 s e a requisição seguinte usa uma conexão nova',
    async () => {
      // O primeiro cliente responde ao ensureAdmin e depois trava, como a conexão de 3/11.
      const first = fakeSql();
      const second = fakeSql();
      const opened = [first, second];
      let i = 0;
      const { client, resets } = guardClient(() => opened[i++].sql);
      const db = drizzle(client as unknown as postgres.Sql, { schema }) as unknown as Db;
      const app = await buildApp({ config, db });
      // Daqui em diante, toda consulta do primeiro cliente fica sem resposta.
      const hang = vi.spyOn(first.sql, 'unsafe').mockImplementation(() => fakeSql({ hang: true }).sql.unsafe('presa'));

      const cookie = `${SESSION_COOKIE}=${app.signCookie(randomToken())}`;
      const started = Date.now();
      const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
      const elapsed = Date.now() - started;

      expect(res.statusCode).toBe(503);
      expect(res.json()).toEqual({ error: 'db_unavailable' });
      expect(res.headers['retry-after']).toBe('5');
      expect(elapsed).toBeGreaterThanOrEqual(QUERY_TIMEOUT_MS - 100);
      expect(elapsed).toBeLessThan(10_000);
      expect(first.ends).toEqual([{ timeout: 0 }]);
      expect(resets()).toBe(1);

      // A próxima requisição vai para o cliente novo: a sessão não existe (consulta vazia), então 401 rápido.
      const again = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
      expect(again.statusCode).toBe(401);
      expect(second.calls.length).toBeGreaterThan(0);
      hang.mockRestore();
      await app.close();
    },
    15_000,
  );

  it('erros que não são do banco continuam com a resposta de antes', async () => {
    const { client } = guardClient(() => fakeSql().sql);
    const db = drizzle(client as unknown as postgres.Sql, { schema }) as unknown as Db;
    const app = await buildApp({ config, db });
    const res = await app.inject({ method: 'POST', url: '/auth/logout', headers: { 'content-type': 'application/json' }, payload: '{' });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
