// Fase 6b: migração 0011 (apresentações) aplicada no banco de teste em memória (PGlite). Confere que ela
// só cria as três tabelas novas e não muda nenhuma tabela existente.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as schema from '../api/_app/db/schema.js';

const tmp: string[] = [];
afterAll(() => tmp.forEach((d) => rmSync(d, { recursive: true, force: true })));

const PRESENTATIONS_TAG = '0011_apresentacoes';
const NEW_TABLES = ['presentation_image_uses', 'presentation_images', 'presentations'];

/** Cópia da pasta de migrações só até a anterior a `tag`. */
function migrationsBefore(tag: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'erp-mig-'));
  tmp.push(dir);
  cpSync('./drizzle', dir, { recursive: true });
  const journalPath = join(dir, 'meta', '_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: { tag: string }[] };
  const at = journal.entries.findIndex((e) => e.tag === tag);
  expect(at).toBeGreaterThan(0);
  for (const e of journal.entries.slice(at)) rmSync(join(dir, `${e.tag}.sql`));
  journal.entries = journal.entries.slice(0, at);
  writeFileSync(journalPath, JSON.stringify(journal));
  return dir;
}

async function database(folder: string) {
  const pg = new PGlite();
  await migrate(drizzle(pg, { schema }), { migrationsFolder: folder });
  return pg;
}

/** Retrato do esquema público: tabelas, colunas, restrições, índices, tipos enumerados, RLS e linhas. */
async function snapshot(pg: PGlite) {
  const q = async (sql: string) => (await pg.query<Record<string, unknown>>(sql)).rows;
  return {
    tables: (await q(`select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'
      order by 1`)).map((r) => r.relname as string),
    columns: await q(`select table_name, column_name, data_type, udt_name, is_nullable, column_default, is_identity
      from information_schema.columns where table_schema = 'public' order by table_name, column_name`),
    constraints: await q(`select conrelid::regclass::text as table_name, conname, pg_get_constraintdef(oid) as def
      from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`),
    indexes: await q(`select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2`),
    enums: await q(`select t.typname, e.enumlabel, e.enumsortorder from pg_type t join pg_enum e on e.enumtypid = t.oid
      order by 1, 3`),
    rls: await q(`select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'
      order by 1`),
    rows: await q(`select 'stages' as t, count(*)::int as n from stages union all select 'users', count(*)::int from users
      union all select 'budgets', count(*)::int from budgets union all select 'audit_log', count(*)::int from audit_log
      union all select 'project_files', count(*)::int from project_files`),
  };
}

describe('migração 0011: apresentações', () => {
  it('cria só as tabelas presentations, presentation_images e presentation_image_uses', async () => {
    const old = await snapshot(await database(migrationsBefore(PRESENTATIONS_TAG)));
    const now = await snapshot(await database('./drizzle'));

    expect(now.tables.filter((t) => !old.tables.includes(t))).toEqual(NEW_TABLES);
    expect(old.tables.filter((t) => !now.tables.includes(t))).toEqual([]);
    expect(now.enums).toEqual(old.enums);

    const cols = (table: string) =>
      now.columns.filter((c) => c.table_name === table).map((c) => [c.column_name, c.data_type, c.is_nullable]);
    expect(cols('presentations')).toEqual([
      ['created_by', 'uuid', 'YES'],
      ['data', 'jsonb', 'NO'],
      ['id', 'uuid', 'NO'],
      ['name', 'text', 'NO'],
      ['number', 'integer', 'NO'],
      ['page_count', 'integer', 'NO'],
      ['pdf_drive_file_id', 'text', 'YES'],
      ['pdf_exported_at', 'timestamp with time zone', 'YES'],
      ['pdf_name', 'text', 'YES'],
      ['pdf_source_hash', 'text', 'YES'],
      ['pdf_version', 'integer', 'NO'],
      ['project_id', 'uuid', 'YES'],
      ['updated_at', 'timestamp with time zone', 'NO'],
    ]);
    expect(cols('presentation_images')).toEqual([
      ['created_at', 'timestamp with time zone', 'NO'],
      ['created_by', 'uuid', 'YES'],
      ['drive_file_id', 'text', 'NO'],
      ['file_name', 'text', 'NO'],
      ['height_px', 'integer', 'NO'],
      ['id', 'uuid', 'NO'],
      ['mime_type', 'text', 'NO'],
      ['owner_presentation_id', 'uuid', 'YES'],
      ['project_id', 'uuid', 'YES'],
      ['size_bytes', 'integer', 'NO'],
      ['trashed_at', 'timestamp with time zone', 'YES'],
      ['width_px', 'integer', 'NO'],
    ]);
    expect(cols('presentation_image_uses')).toEqual([
      ['image_id', 'uuid', 'NO'],
      ['presentation_id', 'uuid', 'NO'],
    ]);

    const newIndexes = now.indexes.filter((i) => NEW_TABLES.includes(i.tablename as string)).map((i) => i.indexname);
    expect(newIndexes).toEqual(
      expect.arrayContaining([
        'presentations_number_idx',
        'presentations_project_updated_idx',
        'presentation_images_project_created_idx',
        'presentation_images_owner_idx',
        'presentation_image_uses_image_idx',
      ]),
    );
    for (const t of NEW_TABLES) expect(now.rls.find((r) => r.relname === t)?.relrowsecurity).toBe(true);
  });

  it('as tabelas existentes (budgets, audit_log, project_files e as outras) não mudam', async () => {
    const old = await snapshot(await database(migrationsBefore(PRESENTATIONS_TAG)));
    const now = await snapshot(await database('./drizzle'));
    const notNew = <T extends Record<string, unknown>>(rows: T[], key: string) =>
      rows.filter((r) => !NEW_TABLES.includes(r[key] as string));

    expect(notNew(now.columns, 'table_name')).toEqual(old.columns);
    expect(notNew(now.constraints, 'table_name')).toEqual(old.constraints);
    expect(notNew(now.indexes, 'tablename')).toEqual(old.indexes);
    expect(notNew(now.rls, 'relname')).toEqual(old.rls);
    expect(now.rows).toEqual(old.rows);
    for (const t of ['budgets', 'audit_log', 'project_files', 'projects', 'users']) {
      expect(old.tables).toContain(t);
      expect(now.columns.filter((c) => c.table_name === t)).toEqual(old.columns.filter((c) => c.table_name === t));
    }
  });

  it('o banco recusa apresentação sem nome ou com nome só de espaços, e numera em sequência', async () => {
    const pg = await database('./drizzle');
    await expect(pg.query(`insert into presentations (name) values ('')`)).rejects.toThrow(/presentations_name_not_blank/);
    await expect(pg.query(`insert into presentations (name) values ('   ')`)).rejects.toThrow(/presentations_name_not_blank/);
    await expect(pg.query(`insert into presentations (name) values (null)`)).rejects.toThrow();
    const { rows } = await pg.query<{ number: number; project_id: string | null; page_count: number; data: unknown; pdf_version: number }>(
      `insert into presentations (name) values ('Apresentação A'), ('Apresentação B')
       returning number, project_id, page_count, data, pdf_version`,
    );
    // Inserção recusada também consome um número da sequência: pode haver saltos, nunca repetição.
    expect(rows.map(({ number: _, ...r }) => r)).toEqual([
      { project_id: null, page_count: 1, data: {}, pdf_version: 0 },
      { project_id: null, page_count: 1, data: {}, pdf_version: 0 },
    ]);
    expect(rows[1].number).toBe(rows[0].number + 1);
    await expect(pg.query(`insert into presentations (name, number) values ('C', 1)`)).rejects.toThrow();
  });

  it('a imagem é do projeto ou de uma avulsa, nunca dos dois nem de nenhum; o vínculo não se repete', async () => {
    const pg = await database('./drizzle');
    const [{ id: pres }] = (await pg.query<{ id: string }>(`insert into presentations (name) values ('Avulsa') returning id`)).rows;
    const img = (owner: string, file: string) =>
      `insert into presentation_images (owner_presentation_id, project_id, drive_file_id, file_name, mime_type, width_px, height_px, size_bytes)
       values (${owner}, null, '${file}', 'capa.png', 'image/png', 1600, 1131, 1000) returning id`;
    await expect(pg.query(img('null', 'f0'))).rejects.toThrow(/presentation_images_owner/);
    const [{ id: image }] = (await pg.query<{ id: string }>(img(`'${pres}'`, 'f1'))).rows;
    await expect(pg.query(img(`'${pres}'`, 'f1'))).rejects.toThrow(/drive_file_id/);
    await pg.query(`insert into presentation_image_uses (presentation_id, image_id) values ('${pres}', '${image}')`);
    await expect(
      pg.query(`insert into presentation_image_uses (presentation_id, image_id) values ('${pres}', '${image}')`),
    ).rejects.toThrow(/presentation_image_uses_pk/);
  });
});
