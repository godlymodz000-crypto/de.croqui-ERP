import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(databaseUrl: string): Db {
  // prepare: false é exigido pelo pooler de transações do Supabase (porta 6543).
  // max: 1 porque cada função serverless atende uma requisição por vez.
  const client = postgres(databaseUrl, { prepare: false, max: process.env.VERCEL ? 1 : 5 });
  return drizzle(client, { schema });
}
