import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Tempo máximo de uma consulta. Passou disso, a conexão é descartada e a requisição responde 503. */
export const QUERY_TIMEOUT_MS = 8_000;
/** Uma transação inteira (várias consultas) tem um pouco mais de folga. */
export const TRANSACTION_TIMEOUT_MS = 15_000;

/** O banco não respondeu a tempo ou a conexão caiu. O app responde 503 em vez de esperar o limite da Vercel. */
export class DbUnavailableError extends Error {
  constructor(
    public reason: 'timeout' | 'connection',
    options?: { cause?: unknown },
  ) {
    super(reason === 'timeout' ? 'o banco não respondeu a tempo' : 'falha de conexão com o banco', options);
  }
}

// Códigos do postgres.js para conexão que não abriu, caiu ou esperou demais na fila.
const CONNECTION_CODES = new Set(['CONNECT_TIMEOUT', 'QUEUE_TIMEOUT', 'CONNECTION_CLOSED', 'CONNECTION_DESTROYED', 'CONNECTION_ENDED', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);

export function isDbUnavailable(err: unknown): boolean {
  // O Drizzle embrulha o erro do driver (DrizzleQueryError); a causa original fica em `cause`.
  for (let e = err, depth = 0; e && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    if (e instanceof DbUnavailableError) return true;
    const code = (e as { code?: unknown }).code;
    // 57014: consulta cancelada pelo tempo máximo (pedido de cancelamento aceito pelo servidor).
    if (typeof code === 'string' && (CONNECTION_CODES.has(code) || code === '57014')) return true;
  }
  return false;
}

/** O que o guarda usa do cliente postgres.js. Interface mínima, para os testes simularem um banco travado. */
export interface SqlLike {
  unsafe(query: string, params?: unknown[], options?: unknown): QueryLike;
  begin(...args: unknown[]): Promise<unknown>;
  end(options?: { timeout?: number | null }): Promise<void>;
  options: { parsers: Record<string, unknown>; serializers: Record<string, unknown> };
}
interface QueryLike extends PromiseLike<unknown> {
  values(): QueryLike;
  signal?(signal: AbortSignal): QueryLike;
}

/**
 * Cliente com tempo máximo em cada consulta. Ao estourar, a consulta recebe um pedido de cancelamento e,
 * se nem assim responder, o cliente inteiro é trocado por um novo: as conexões antigas são destruídas,
 * o pooler libera a conexão do servidor e a próxima requisição já usa uma conexão limpa.
 */
export function guardClient(open: () => SqlLike, timeouts = { query: QUERY_TIMEOUT_MS, transaction: TRANSACTION_TIMEOUT_MS }) {
  let current = open();
  let resets = 0;

  function reset() {
    const old = current;
    current = open();
    // O Drizzle registra parsers e serializers no cliente ao ser criado; o substituto precisa dos mesmos.
    Object.assign(current.options.parsers, old.options.parsers);
    Object.assign(current.options.serializers, old.options.serializers);
    resets++;
    // timeout 0: rejeita o que estiver pendente e destrói as conexões na hora.
    old.end({ timeout: 0 }).catch(() => {});
  }

  function deadline<T>(work: PromiseLike<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reset();
        reject(new DbUnavailableError('timeout'));
      }, ms);
      Promise.resolve(work).then(
        (value) => (clearTimeout(timer), resolve(value)),
        (err) => (clearTimeout(timer), reject(isDbUnavailable(err) ? new DbUnavailableError('connection', { cause: err }) : err)),
      );
    });
  }

  function guardQuery(q: QueryLike): QueryLike {
    return new Proxy(q, {
      get(target, prop) {
        if (prop === 'values') return () => guardQuery(target.values());
        if (prop === 'then') {
          return (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
            // Pedido de cancelamento no servidor um pouco antes do corte local.
            target.signal?.(AbortSignal.timeout(Math.max(1, timeouts.query - 500)));
            return deadline(target, timeouts.query).then(onFulfilled, onRejected);
          };
        }
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  const client = new Proxy({} as SqlLike, {
    get(_, prop) {
      if (prop === 'unsafe') return (...args: Parameters<SqlLike['unsafe']>) => guardQuery(current.unsafe(...args));
      if (prop === 'begin') return (...args: unknown[]) => deadline(current.begin(...args), timeouts.transaction);
      const value = Reflect.get(current, prop, current);
      return typeof value === 'function' ? value.bind(current) : value;
    },
  });

  return { client, resets: () => resets };
}

export function createDb(databaseUrl: string): Db {
  const { client } = guardClient(
    () =>
      postgres(databaseUrl, {
        // O pooler de transações do Supabase (porta 6543) não guarda prepared statements.
        prepare: false,
        // max 1 na Vercel: cada instância abre uma conexão só com o pooler.
        max: process.env.VERCEL ? 1 : 5,
        // Uma consulta por vez em cada conexão. Com o padrão (100), o postgres.js encadeia as consultas de
        // requisições simultâneas na mesma conexão, e sobre o pooler de transações isso deixou uma conexão
        // presa no meio do protocolo (diagnóstico de 3/11/2026).
        max_pipeline: 1,
        connect_timeout: 5,
        // Esperar a vez na conexão também tem limite (em segundos).
        queue_timeout: QUERY_TIMEOUT_MS / 1000,
        idle_timeout: 20,
      }) as unknown as SqlLike,
  );
  return drizzle(client as unknown as postgres.Sql, { schema });
}
