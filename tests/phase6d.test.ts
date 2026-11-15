// Testes da Fase 6d, etapa E2: a API grava e relê a prancha e os formatos novos (revisao-fase6d/planejamento.md,
// seções 2 e 3). Banco em memória (PGlite) e Drive simulado (FakeDrive): nenhum teste grava no banco de produção
// nem fala com o Google. Nenhum teste apaga ou altera linhas de audit_log.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import {
  ADDABLE_PAGE_TYPES,
  newPresentationPage,
  newVisualImage,
  PRESENTATION_MAX_BYTES,
  PRESENTATION_MAX_PHOTOS,
  type PresentationData,
  type PresentationImageRef,
  type PresentationPranchaPage,
} from '../src/shared/presentation-data.js';
import { FakeDrive } from './fake-drive.js';
import { FakeCalendar } from './fake-calendar.js';

const config: Config = {
  databaseUrl: 'pglite://memory',
  googleClientId: 'test',
  googleClientSecret: 'test',
  googleRedirectUri: 'http://localhost:3001/auth/google/callback',
  sessionSecret: randomToken(32),
  adminEmail: 'admin@decroqui.test',
  tokenEncryptionKey: Buffer.alloc(32, 7),
  appUrl: 'http://localhost:5173',
  secureCookies: false,
};

let db: Db;
let app: FastifyInstance;
let drive: FakeDrive;
let member: { cookie: string };

interface Pres {
  id: string;
  updatedAt: string;
  data: PresentationData;
}

async function presentation(name: string): Promise<Pres> {
  const res = await app.inject({ method: 'POST', url: '/presentations', headers: member, payload: { name } });
  expect(res.statusCode).toBe(201);
  return res.json();
}

const patch = (id: string, payload: Record<string, unknown>) => app.inject({ method: 'PATCH', url: `/presentations/${id}`, headers: member, payload });
const read = async (id: string): Promise<Pres> => {
  const res = await app.inject({ method: 'GET', url: `/presentations/${id}`, headers: member });
  expect(res.statusCode).toBe(200);
  return res.json();
};
const row = async (id: string) => (await db.select().from(schema.presentations).where(eq(schema.presentations.id, id)))[0];
const usesOf = async (presentationId: string) =>
  (await db.select().from(schema.presentationImageUses).where(eq(schema.presentationImageUses.presentationId, presentationId))).map((u) => u.imageId).sort();

/** Envio completo de uma imagem pelo Drive simulado. A conferência de proporção e dpi da prancha é da E3. */
async function upload(presId: string) {
  const file = { name: 'prancha.png', mimeType: 'image/png', size: 1000, width: 3508, height: 2480 };
  const open = await app.inject({ method: 'POST', url: `/presentations/${presId}/images/uploads`, headers: member, payload: file });
  expect(open.statusCode).toBe(201);
  const driveFileId = drive.browserUpload(open.json().uploadUrl, { width: 3508, height: 2480 });
  const done = await app.inject({ method: 'POST', url: `/presentations/${presId}/images/complete`, headers: member, payload: { token: open.json().token, driveFileId } });
  expect(done.statusCode).toBe(201);
  return done.json().id as string;
}

const ref = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });
let seq = 0;
const newId = () => `e2d-${++seq}`;

function prancha(imageId: string | null, extra: Partial<PresentationPranchaPage> = {}): PresentationPranchaPage {
  const p = newPresentationPage('prancha', newId);
  return { ...p, titulo: 'Recepção · balcão', ...(imageId ? { imagem: ref(imageId), moldura: 1 as const } : {}), ...extra };
}

/** A capa e uma página nova de cada tipo da 6c, na ordem do menu. */
function allTypes(base: PresentationData): PresentationData {
  const d = structuredClone(base);
  return { ...d, paginas: [d.paginas[0], ...ADDABLE_PAGE_TYPES.map((t) => newPresentationPage(t, newId))] };
}

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  drive = new FakeDrive();
  app = await buildApp({ config, db, drive, calendar: new FakeCalendar() });
  const [u] = await db.insert(schema.users).values({ email: 'member@exemplo.com', name: 'Colaborador Teste', role: 'member', status: 'active' }).returning();
  const { token } = await createSession(db, u.id);
  member = { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
});

afterEach(async () => {
  await app.close();
});

describe('Fase 6d · E2 · prancha salva e relida', () => {
  it('grava duas pranchas, A4 e A3, entre páginas da 6c, e relê igual, com page_count certo', async () => {
    const a = await presentation('Com pranchas');
    const img = await upload(a.id);
    const d = allTypes(a.data);
    d.paginas.push(prancha(img), prancha(null, { folha: 'a3', titulo: '', fase: 'Anteprojeto', rodape: false }));
    const res = await patch(a.id, { data: d, baseUpdatedAt: a.updatedAt });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual(d);
    expect((await read(a.id)).data).toEqual(d);
    const stored = await row(a.id);
    expect(stored.data).toEqual(d);
    expect(stored.pageCount).toBe(9);
    expect(await usesOf(a.id)).toEqual([img]);
  });

  it('formato a3 e wide gravam e voltam iguais', async () => {
    const a = await presentation('Formatos');
    let base = a;
    for (const formato of ['a3', 'wide', 'a4'] as const) {
      const d: PresentationData = { ...a.data, projeto: { ...a.data.projeto, formato } };
      const res = await patch(a.id, { data: d, baseUpdatedAt: base.updatedAt });
      expect(res.statusCode, formato).toBe(200);
      base = res.json();
      expect((await read(a.id)).data.projeto.formato).toBe(formato);
    }
  });

  it('prancha fora da regra recebe 400 com o motivo, a página e o campo, e nada é gravado', async () => {
    const a = await presentation('Recusas');
    const img = await upload(a.id);
    const capa = a.data.paginas[0];
    const cases: [unknown, Record<string, unknown>][] = [
      [prancha(img, { folha: 'wide' as never }), { reason: 'field', pagina: 1, campo: 'folha' }],
      [prancha(img, { moldura: 2 as never }), { reason: 'field', pagina: 1, campo: 'moldura' }],
      [{ ...prancha(img), moldura: undefined }, { reason: 'field', pagina: 1, campo: 'moldura' }],
      [{ id: 'pr', tipo: 'prancha' }, { reason: 'field', pagina: 1 }],
    ];
    for (const [page, detail] of cases) {
      const res = await patch(a.id, { data: { ...a.data, paginas: [capa, page] } });
      expect(res.statusCode, JSON.stringify(detail)).toBe(400);
      expect(res.json()).toMatchObject({ error: 'validation', fields: { data: 'invalid' }, dataError: detail });
    }
    const formato = await patch(a.id, { data: { ...a.data, projeto: { ...a.data.projeto, formato: 'a5' } } });
    expect(formato.statusCode).toBe(400);
    expect(formato.json()).toMatchObject({ dataError: { reason: 'project', campo: 'formato' } });
    const stored = await row(a.id);
    expect(stored.data).toEqual(a.data);
    expect(stored.updatedAt.toISOString()).toBe(a.updatedAt);
    expect(await usesOf(a.id)).toEqual([]);
  });
});

describe('Fase 6d · E2 · documento da 6c', () => {
  it('o documento da 6c salva e volta sem mudança, com formato a4', async () => {
    const a = await presentation('Só 6c');
    const d = allTypes(a.data);
    d.projeto.cliente = 'Cliente Avulso';
    const res = await patch(a.id, { data: d });
    expect(res.statusCode).toBe(200);
    const again = await read(a.id);
    // Mesmo conteúdo, campo a campo. A ordem das chaves não conta: o Postgres guarda em jsonb e a reordena.
    expect(again.data).toEqual(d);
    expect(again.data.projeto.formato).toBe('a4');
    expect((await row(a.id)).pageCount).toBe(7);
  });
});

describe('Fase 6d · E2 · limites contam a prancha', () => {
  /** Capa com a primeira foto e páginas "Várias imagens do ambiente" com as outras, 8 por página. */
  const withPhotos = (base: PresentationData, ids: string[]): PresentationData => {
    const d = structuredClone(base);
    d.paginas[0].imagem = ids[0] ? ref(ids[0]) : null;
    const rest = ids.slice(1);
    const pages = [];
    for (let i = 0; i < rest.length; i += 8) {
      const page = newPresentationPage('visual', newId);
      page.composicao = 'grade';
      const chunk = rest.slice(i, i + 8);
      while (chunk.length < 4) chunk.push('');
      page.imagens = chunk.map((id) => ({ ...newVisualImage(newId), imagem: id ? ref(id) : null }));
      pages.push(page);
    }
    return { ...d, paginas: [d.paginas[0], ...pages] };
  };

  it('teto de 50 fotos (P41): 49 fotos e a prancha gravam; a prancha como 51ª é recusada, e nada muda', async () => {
    expect(PRESENTATION_MAX_PHOTOS).toBe(50);
    const a = await presentation('Teto com prancha');
    const imgs: string[] = [];
    for (let i = 0; i < 51; i++) imgs.push(await upload(a.id));

    const fifty = withPhotos(a.data, imgs.slice(0, 49));
    fifty.paginas.push(prancha(imgs[49]));
    let res = await patch(a.id, { data: fifty });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toHaveLength(50);
    expect(await usesOf(a.id)).toContain(imgs[49]);
    const savedAt = res.json().updatedAt;

    const over = withPhotos(a.data, imgs.slice(0, 50));
    over.paginas.push(prancha(imgs[50]));
    res = await patch(a.id, { data: over, baseUpdatedAt: savedAt });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'validation', fields: { data: 'too_many_photos' }, dataError: { reason: 'too_many_photos' }, count: 51, limit: 50 });
    expect(await usesOf(a.id)).toHaveLength(50);
    expect((await read(a.id)).updatedAt).toBe(savedAt);
  });

  it('limite de 1 MiB: documento com prancha acima do limite recebe 413, e nada é gravado', async () => {
    const size = (d: unknown) => Buffer.byteLength(JSON.stringify(d), 'utf8');
    const a = await presentation('Grande com prancha');
    const d = allTypes(a.data);
    const p = prancha(null);
    d.paginas.push(p);
    const base = size(d);
    // Só a prancha cresce: o título dela é texto curto, então a folga vai num campo descartado da prancha.
    const over = { ...d, paginas: [...d.paginas.slice(0, -1), { ...p, folga: 'x'.repeat(PRESENTATION_MAX_BYTES - base + 10) }] };
    expect(size(over)).toBeGreaterThan(PRESENTATION_MAX_BYTES);
    const res = await patch(a.id, { data: over });
    expect(res.statusCode).toBe(413);
    expect(res.json()).toEqual({ error: 'too_large', size: size(over), limit: PRESENTATION_MAX_BYTES });
    expect((await row(a.id)).updatedAt.toISOString()).toBe(a.updatedAt);

    const ok = await patch(a.id, { data: d });
    expect(ok.statusCode).toBe(200);
    expect((await read(a.id)).data).toEqual(d);
  });
});
