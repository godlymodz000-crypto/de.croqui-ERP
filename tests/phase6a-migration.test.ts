// Fase 6a: migração 0008 (tabela budgets) aplicada no banco de teste em memória (PGlite).
// Confere que a migração só cria a tabela nova e não muda nenhuma tabela existente.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as schema from '../api/_app/db/schema.js';

const BUDGETS_TAG = '0008_orcamentos';

/** Cópia da pasta de migrações só até a anterior à de orçamentos. */
function migrationsBeforeBudgets(): string {
  const dir = mkdtempSync(join(tmpdir(), 'erp-mig-'));
  cpSync('./drizzle', dir, { recursive: true });
  const journalPath = join(dir, 'meta', '_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: { tag: string }[] };
  const at = journal.entries.findIndex((e) => e.tag === BUDGETS_TAG);
  expect(at).toBeGreaterThan(0);
  journal.entries = journal.entries.slice(0, at);
  writeFileSync(journalPath, JSON.stringify(journal));
  rmSync(join(dir, `${BUDGETS_TAG}.sql`));
  return dir;
}

async function database(folder: string) {
  const pg = new PGlite();
  await migrate(drizzle(pg, { schema }), { migrationsFolder: folder });
  return pg;
}

/** Retrato do esquema público: colunas, restrições, índices, tipos enumerados e RLS. */
async function snapshot(pg: PGlite) {
  const q = async (sql: string) => (await pg.query<Record<string, unknown>>(sql)).rows;
  return {
    columns: await q(`select table_name, column_name, data_type, udt_name, is_nullable, column_default, is_identity
      from information_schema.columns where table_schema = 'public' order by table_name, column_name`),
    constraints: await q(`select conrelid::regclass::text as table_name, conname, pg_get_constraintdef(oid) as def
      from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`),
    indexes: await q(`select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2`),
    enums: await q(`select t.typname, e.enumlabel, e.enumsortorder from pg_type t join pg_enum e on e.enumtypid = t.oid
      order by 1, 3`),
    rls: await q(`select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'
      order by 1`),
    rows: await q(`select 'stages' as t, count(*)::int as n from stages union all select 'users', count(*)::int from users`),
  };
}

const tmp: string[] = [];
afterAll(() => tmp.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('migração 0008: orçamentos', () => {
  it('cria só a tabela budgets e o tipo budget_status; as tabelas existentes não mudam', async () => {
    const before = migrationsBeforeBudgets();
    tmp.push(before);
    const old = await snapshot(await database(before));
    const now = await snapshot(await database('./drizzle'));

    const notBudgets = <T extends Record<string, unknown>>(rows: T[], key: string) => rows.filter((r) => r[key] !== 'budgets');
    expect(notBudgets(now.columns, 'table_name')).toEqual(old.columns);
    expect(notBudgets(now.constraints, 'table_name')).toEqual(old.constraints);
    expect(notBudgets(now.indexes, 'tablename')).toEqual(old.indexes);
    expect(notBudgets(now.rls, 'relname')).toEqual(old.rls);
    expect(now.enums.filter((e) => e.typname !== 'budget_status')).toEqual(old.enums);
    expect(now.rows).toEqual(old.rows);

    expect(now.columns.filter((c) => c.table_name === 'budgets').map((c) => [c.column_name, c.is_nullable])).toEqual([
      ['created_by', 'YES'],
      ['data', 'NO'],
      ['id', 'NO'],
      ['name', 'NO'],
      ['number', 'NO'],
      ['project_id', 'YES'],
      ['status', 'NO'],
      ['total_cents', 'NO'],
      ['updated_at', 'NO'],
    ]);
    expect(now.rls.find((r) => r.relname === 'budgets')?.relrowsecurity).toBe(true);
  });

  it('o banco recusa orçamento sem nome ou com nome só de espaços, e numera em sequência', async () => {
    const pg = await database('./drizzle');
    await expect(pg.query(`insert into budgets (name) values ('')`)).rejects.toThrow(/budgets_name_not_blank/);
    await expect(pg.query(`insert into budgets (name) values ('   ')`)).rejects.toThrow(/budgets_name_not_blank/);
    await expect(pg.query(`insert into budgets (name) values (null)`)).rejects.toThrow();
    const { rows } = await pg.query<{ number: number; project_id: string | null; status: string; total_cents: string; data: unknown }>(
      `insert into budgets (name) values ('Orçamento A'), ('Orçamento B') returning number, project_id, status, total_cents, data`,
    );
    // Inserção recusada também consome um número da sequência: pode haver saltos, nunca repetição.
    expect(rows.map(({ number: _, ...r }) => r)).toEqual([
      { project_id: null, status: 'draft', total_cents: 0, data: {} },
      { project_id: null, status: 'draft', total_cents: 0, data: {} },
    ]);
    expect(rows[1].number).toBe(rows[0].number + 1);
    await expect(pg.query(`insert into budgets (name, number) values ('C', 1)`)).rejects.toThrow();
  });
});
