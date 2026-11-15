// Testes da Fase 6c, etapa E2: a API com os tipos de página novos (revisao-fase6c/planejamento.md, seção 6).
// Banco em memória (PGlite) e Drive simulado (FakeDrive): nenhum teste grava no banco de produção nem fala com
// o Google. Nenhum teste apaga ou altera linhas de audit_log; só lê.
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
} from '../src/shared/presentation-data.js';
import { FakeDrive } from './fake-drive.js';
import { FakeCalendar } from './fake-calendar.js';

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
let drive: FakeDrive;
type Headers = { cookie: string };
let member: Headers;
let viewer: Headers;

async function login(userId: string): Promise<Headers> {
  const { token } = await createSession(db, userId);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

async function person(role: 'member' | 'viewer', name: string) {
  const [u] = await db.insert(schema.users).values({ email: `${role}@exemplo.com`, name, role, status: 'active' }).returning();
  return login(u.id);
}

interface Pres {
  id: string;
  updatedAt: string;
  data: PresentationData;
}

async function project(name = 'Projeto Teste') {
  const res = await app.inject({ method: 'POST', url: '/projects', headers: member, payload: { name, clientName: 'Cliente Avulso' } });
  expect(res.statusCode).toBe(201);
  return res.json() as { id: string };
}

async function presentation(name: string, projectId?: string): Promise<Pres> {
  const res = await app.inject({ method: 'POST', url: '/presentations', headers: member, payload: { name, ...(projectId ? { projectId } : {}) } });
  expect(res.statusCode).toBe(201);
  return res.json();
}

const patch = (id: string, payload: Record<string, unknown>, headers: Headers = member) =>
  app.inject({ method: 'PATCH', url: `/presentations/${id}`, headers, payload });
const read = async (id: string): Promise<Pres> => {
  const res = await app.inject({ method: 'GET', url: `/presentations/${id}`, headers: member });
  expect(res.statusCode).toBe(200);
  return res.json();
};
const row = async (id: string) => (await db.select().from(schema.presentations).where(eq(schema.presentations.id, id)))[0];

/** Envio completo de uma imagem: abre a sessão, o "navegador" envia ao Drive e a API conclui. */
async function upload(presId: string) {
  const file = { name: 'render.png', mimeType: 'image/png', size: 1000, width: 1600, height: 1131 };
  const open = await app.inject({ method: 'POST', url: `/presentations/${presId}/images/uploads`, headers: member, payload: file });
  expect(open.statusCode).toBe(201);
  const driveFileId = drive.browserUpload(open.json().uploadUrl, { width: 1600, height: 1131 });
  const done = await app.inject({
    method: 'POST',
    url: `/presentations/${presId}/images/complete`,
    headers: member,
    payload: { token: open.json().token, driveFileId },
  });
  expect(done.statusCode).toBe(201);
  return { id: done.json().id as string, driveFileId };
}

const ref = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1.2, x: 40, y: 60 });
let seq = 0;
const newId = () => `e2-${++seq}`;

/** A capa da apresentação e uma página nova de cada tipo, na ordem do menu de adicionar. */
function allTypes(base: PresentationData): PresentationData {
  // Cópia: os testes mudam a capa sem mexer no documento que a API devolveu.
  const d = structuredClone(base);
  return { ...d, paginas: [d.paginas[0], ...ADDABLE_PAGE_TYPES.map((t) => newPresentationPage(t, newId))] };
}

/** Preenche todos os campos de texto de todas as páginas e itens com valores fictícios. */
function filledAllTypes(base: PresentationData): PresentationData {
  const d = allTypes(base);
  const [capa, texto, mood, visual, tecnico, notas, direitos] = d.paginas;
  if (capa.tipo !== 'capa' || texto.tipo !== 'texto' || mood.tipo !== 'moodboard' || visual.tipo !== 'visual') throw new Error('ordem');
  if (tecnico.tipo !== 'tecnico' || notas.tipo !== 'notas' || direitos.tipo !== 'direitos') throw new Error('ordem');
  Object.assign(capa, { composicao: 'foto', cor: 'linho', marca: 'g' });
  Object.assign(texto, { introducao: 'Apresentação do projeto para o Cliente Avulso.', composicao: 'livre' });
  texto.blocos[0] = { ...texto.blocos[0], tipo: 'texto', titulo: 'Conceito', texto: 'Texto do conceito.' } as (typeof texto.blocos)[number];
  const imgBlock = texto.blocos[3];
  if (imgBlock.tipo === 'imagem') Object.assign(imgBlock, { legenda: 'Fachada', formato: 'retangular', posicao: 'direita', altura: 'g' });
  Object.assign(mood, { introducao: 'Materiais propostos.' });
  Object.assign(mood.materiais[0], { nome: 'Madeira', fabricante: 'Fornecedor Teste', codigo: 'MD-01', acabamento: 'Natural', ambiente: 'Sala', observacoes: 'Contato: (00) 00000-0000' });
  Object.assign(visual, { titulo: 'Sala de estar', descricao: 'Descrição curta.', programas: 'SketchUp · V-Ray', observacoes: 'Sem observações.' });
  visual.imagens[0].legenda = 'Vista geral';
  Object.assign(tecnico, { observacoes: 'Medidas em centímetros.', escala: '1:50 · indicada', unidade: 'cm' });
  tecnico.desenhos[0].titulo = 'Planta baixa · layout';
  Object.assign(notas, { introducao: 'Diretrizes do projeto.' });
  Object.assign(notas.notas[0], { titulo: 'Geral', texto: 'Conferir medidas no local.' });
  Object.assign(direitos, {
    autoria: 'Projeto de autoria de Colaborador Teste.',
    escritorio: 'De.Croqui, responsável pelo material.',
    uso: 'Material destinado ao Cliente Avulso.',
    restricoes: 'Reprodução depende de autorização por escrito.',
    observacoes: 'Contato: contato@exemplo.com',
  });
  return d;
}

const usesOf = async (presentationId: string) =>
  (await db.select().from(schema.presentationImageUses).where(eq(schema.presentationImageUses.presentationId, presentationId))).map((u) => u.imageId).sort();
const imageRow = async (id: string) => (await db.select().from(schema.presentationImages).where(eq(schema.presentationImages.id, id)))[0];
const inTrash = (driveFileId: string) => drive.folders.get(driveFileId)?.trashed === true;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  drive = new FakeDrive();
  app = await buildApp({ config, db, drive, calendar: new FakeCalendar() });
  member = await person('member', 'Colaborador Teste');
  viewer = await person('viewer', 'Leitor Teste');
});

afterEach(async () => {
  await app.close();
});

describe('Fase 6c · E2 · cada tipo salvo e relido', () => {
  it('grava a capa e os seis tipos com todos os campos e relê igual, com page_count certo', async () => {
    const a = await presentation('Apresentação completa');
    const doc = filledAllTypes(a.data);
    const res = await patch(a.id, { data: doc, baseUpdatedAt: a.updatedAt });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual(doc);
    expect(res.json().pageCount ?? (await row(a.id)).pageCount).toBe(7);

    const again = await read(a.id);
    expect(again.data).toEqual(doc);
    expect(again.data.paginas.map((p) => p.tipo)).toEqual(['capa', 'texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos']);
    const stored = await row(a.id);
    expect(stored.pageCount).toBe(7);
    expect(stored.data).toEqual(doc);
  });

  it('cada tipo, sozinho depois da capa, é salvo e relido sem perder campos', async () => {
    const a = await presentation('Um tipo por vez');
    let base = a;
    for (const tipo of ADDABLE_PAGE_TYPES) {
      const doc: PresentationData = { ...a.data, paginas: [a.data.paginas[0], newPresentationPage(tipo, newId)] };
      const res = await patch(a.id, { data: doc, baseUpdatedAt: base.updatedAt });
      expect(res.statusCode, tipo).toBe(200);
      base = res.json();
      expect((await read(a.id)).data, tipo).toEqual(doc);
      expect((await row(a.id)).pageCount, tipo).toBe(2);
    }
  });

  it('o documento da 6b, só com a capa, continua salvando e voltando igual', async () => {
    const a = await presentation('Só a capa');
    const doc: PresentationData = { ...a.data, paginas: [{ ...a.data.paginas[0], composicao: 'tipo', cor: 'noite', marca: 'm' }] };
    const res = await patch(a.id, { data: doc });
    expect(res.statusCode).toBe(200);
    expect((await read(a.id)).data).toEqual(doc);
    expect((await row(a.id)).pageCount).toBe(1);
  });

  it('remover páginas e mudar a ordem atualiza page_count', async () => {
    const a = await presentation('Ordem');
    const doc = allTypes(a.data);
    let res = await patch(a.id, { data: doc });
    expect(res.statusCode).toBe(200);
    const [capa, ...rest] = doc.paginas;
    const reordered: PresentationData = { ...doc, paginas: [capa, ...(rest.reverse().slice(0, 3) as typeof rest)] };
    res = await patch(a.id, { data: reordered, baseUpdatedAt: res.json().updatedAt });
    expect(res.statusCode).toBe(200);
    expect((await read(a.id)).data.paginas.map((p) => p.tipo)).toEqual(['capa', 'direitos', 'notas', 'tecnico']);
    expect((await row(a.id)).pageCount).toBe(4);
  });

  it('documento fora da regra recebe 400 com o motivo e a página, e nada é gravado', async () => {
    const a = await presentation('Recusas');
    const doc = allTypes(a.data);
    const cases: [unknown, Record<string, unknown>][] = [
      [{ ...doc, paginas: [doc.paginas[1], doc.paginas[0]] }, { reason: 'cover_first', pagina: 0 }],
      [{ ...doc, paginas: [doc.paginas[0], { ...doc.paginas[0], id: 'capa-2' }] }, { reason: 'second_cover', pagina: 1 }],
      [{ ...doc, paginas: [doc.paginas[0], { id: 'pr', tipo: 'prancha' }] }, { reason: 'page_type', pagina: 1 }],
      [{ ...doc, paginas: [doc.paginas[0], ...Array.from({ length: 40 }, () => newPresentationPage('direitos', newId))] }, { reason: 'too_many_pages' }],
      [
        { ...doc, paginas: [doc.paginas[0], { ...newPresentationPage('notas', newId), notas: Array.from({ length: 13 }, (_, i) => ({ id: `n${i}`, categoria: '', titulo: '', texto: '' })) }] },
        { reason: 'too_many_items', pagina: 1, campo: 'notas' },
      ],
    ];
    for (const [data, detail] of cases) {
      const res = await patch(a.id, { data });
      expect(res.statusCode, JSON.stringify(detail)).toBe(400);
      expect(res.json()).toMatchObject({ error: 'validation', fields: { data: 'invalid' }, dataError: detail });
    }
    const b64 = await patch(a.id, { data: { ...doc, paginas: [doc.paginas[0], { ...doc.paginas[6], autoria: 'data:image/png;base64,iVBORw0KGgo=' }] } });
    expect(b64.statusCode).toBe(400);
    expect(b64.json()).toMatchObject({ fields: { data: 'base64' }, dataError: { reason: 'base64', pagina: 1, campo: 'autoria' } });

    const stored = await row(a.id);
    expect(stored.data).toEqual(a.data);
    expect(stored.pageCount).toBe(1);
    expect(stored.updatedAt.toISOString()).toBe(a.updatedAt);
  });
});

describe('Fase 6c · E2 · vínculos de imagem e lixeira em todas as páginas', () => {
  it('as imagens de todas as páginas e itens entram nos vínculos', async () => {
    const p = await project();
    const a = await presentation('Imagens', p.id);
    const [i1, i2, i3, i4, i5] = [await upload(a.id), await upload(a.id), await upload(a.id), await upload(a.id), await upload(a.id)];
    const d = allTypes(a.data);
    const [capa, texto, mood, visual, tecnico] = d.paginas;
    if (capa.tipo !== 'capa' || texto.tipo !== 'texto' || mood.tipo !== 'moodboard' || visual.tipo !== 'visual' || tecnico.tipo !== 'tecnico') throw new Error('ordem');
    capa.imagem = ref(i1.id);
    const b = texto.blocos[3];
    if (b.tipo === 'imagem') b.imagem = ref(i2.id);
    mood.materiais[2].imagem = ref(i3.id);
    visual.imagens[0].imagem = ref(i4.id);
    tecnico.desenhos[0].imagem = ref(i5.id);
    const res = await patch(a.id, { data: d });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([i1.id, i2.id, i3.id, i4.id, i5.id].sort());
    expect((await read(a.id)).data).toEqual(d);
  });

  it('remover a página de uma imagem que outra página usa não manda a imagem para a lixeira', async () => {
    const p = await project();
    const a = await presentation('Duas páginas', p.id);
    const img = await upload(a.id);
    const d = allTypes(a.data);
    const visual = d.paginas[3];
    const tecnico = d.paginas[4];
    if (visual.tipo !== 'visual' || tecnico.tipo !== 'tecnico') throw new Error('ordem');
    visual.imagens[0].imagem = ref(img.id);
    tecnico.desenhos[0].imagem = ref(img.id);
    let res = await patch(a.id, { data: d });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([img.id]);

    // Sai a página visual; o desenho técnico continua com a imagem.
    const semVisual: PresentationData = { ...d, paginas: d.paginas.filter((pg) => pg.tipo !== 'visual') as PresentationData['paginas'] };
    res = await patch(a.id, { data: semVisual, baseUpdatedAt: res.json().updatedAt });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([img.id]);
    expect((await imageRow(img.id)).trashedAt).toBeNull();
    expect(inTrash(img.driveFileId)).toBe(false);

    // Sai também o técnico: nenhuma página usa mais a imagem, e ela vai para a lixeira (regra da 6b).
    const semNenhuma: PresentationData = { ...semVisual, paginas: semVisual.paginas.filter((pg) => pg.tipo !== 'tecnico') as PresentationData['paginas'] };
    res = await patch(a.id, { data: semNenhuma, baseUpdatedAt: res.json().updatedAt });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([]);
    expect((await imageRow(img.id)).trashedAt).not.toBeNull();
    expect(inTrash(img.driveFileId)).toBe(true);
    const log = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, 'presentation.image_trash'));
    expect(log.map((l) => l.entityId)).toEqual([img.id]);
  });

  it('a imagem usada por outra apresentação do projeto não vai para a lixeira ao sair da última página', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const b = await presentation('B', p.id);
    const img = await upload(a.id);
    const da = allTypes(a.data);
    const ma = da.paginas[2];
    if (ma.tipo !== 'moodboard') throw new Error('ordem');
    ma.materiais[0].imagem = ref(img.id);
    expect((await patch(a.id, { data: da })).statusCode).toBe(200);
    const db_ = { ...b.data, paginas: [{ ...b.data.paginas[0], imagem: ref(img.id) }] } as PresentationData;
    expect((await patch(b.id, { data: db_ })).statusCode).toBe(200);

    const res = await patch(a.id, { data: { ...da, paginas: [da.paginas[0]] } });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([]);
    expect(await usesOf(b.id)).toEqual([img.id]);
    expect((await imageRow(img.id)).trashedAt).toBeNull();
    expect(inTrash(img.driveFileId)).toBe(false);
  });

  it('as imagens guardadas e escondidas contam para o vínculo e não vão para a lixeira (P32, P33)', async () => {
    const p = await project();
    const a = await presentation('Escondidas', p.id);
    const [i1, i2, i3] = [await upload(a.id), await upload(a.id), await upload(a.id)];
    const d = allTypes(a.data);
    const capa = d.paginas[0];
    const visual = d.paginas[3];
    if (visual.tipo !== 'visual') throw new Error('ordem');
    // Capa "Só tipografia" com a imagem guardada; visual em "lado", que mostra 1, com 3 guardadas.
    capa.composicao = 'tipo';
    capa.imagem = ref(i1.id);
    visual.composicao = 'lado';
    visual.imagens = [i2, i3].map((i) => ({ ...newVisualImage(newId), imagem: ref(i.id) }));
    visual.imagens.unshift(newVisualImage(newId));
    let res = await patch(a.id, { data: d });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([i1.id, i2.id, i3.id].sort());

    // Uma alteração de texto não mexe nas imagens guardadas.
    const next = structuredClone(d);
    next.projeto.cliente = 'Cliente Avulso';
    res = await patch(a.id, { data: next, baseUpdatedAt: res.json().updatedAt });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toEqual([i1.id, i2.id, i3.id].sort());
    for (const i of [i1, i2, i3]) {
      expect((await imageRow(i.id)).trashedAt).toBeNull();
      expect(inTrash(i.driveFileId)).toBe(false);
    }
    const again = await read(a.id);
    expect(again.data.paginas[0].imagem).toEqual(ref(i1.id));
    expect(again.data.paginas[3].tipo === 'visual' && again.data.paginas[3].imagens).toHaveLength(3);
  });

  it('imagem de outra biblioteca numa página nova é recusada, como na capa da 6b', async () => {
    const a = await presentation('Avulsa A');
    const b = await presentation('Avulsa B');
    const img = await upload(a.id);
    const d = allTypes(b.data);
    const tecnico = d.paginas[4];
    if (tecnico.tipo !== 'tecnico') throw new Error('ordem');
    tecnico.desenhos[0].imagem = ref(img.id);
    const res = await patch(b.id, { data: d });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ fields: { data: 'image_not_in_library' }, images: [img.id] });
    expect(await usesOf(b.id)).toEqual([]);
  });
});

describe('Fase 6c · E2 · limite de 1 MiB', () => {
  const size = (d: unknown) => Buffer.byteLength(JSON.stringify(d), 'utf8');
  /** Documento de tamanho exato em bytes UTF-8 (acentos contam 2), com um campo de folga descartado ao gravar. */
  const padded = (data: PresentationData, extra: number) => {
    const d = { ...data, folga: '' };
    d.folga = 'é'.repeat(Math.floor((PRESENTATION_MAX_BYTES - size(d) + extra) / 2));
    return d;
  };

  it('o limite é 1 MiB: logo abaixo grava; acima recebe 413 com o tamanho e o limite', async () => {
    expect(PRESENTATION_MAX_BYTES).toBe(1024 * 1024);
    const a = await presentation('Grande');
    const doc = filledAllTypes(a.data);

    const over = padded(doc, 2);
    expect(size(over)).toBeGreaterThan(PRESENTATION_MAX_BYTES);
    const huge = await patch(a.id, { data: over });
    expect(huge.statusCode).toBe(413);
    expect(huge.json()).toEqual({ error: 'too_large', size: size(over), limit: 1024 * 1024 });
    let stored = await row(a.id);
    expect(stored.data).toEqual(a.data);
    expect(stored.updatedAt.toISOString()).toBe(a.updatedAt);

    // Bem acima de 1 MiB, mas abaixo do corpo aceito: a resposta continua a própria, com tamanho e limite.
    const big = { ...doc, folga: 'x'.repeat(1536 * 1024) };
    const res = await patch(a.id, { data: big });
    expect(res.statusCode).toBe(413);
    expect(res.json()).toEqual({ error: 'too_large', size: size(big), limit: PRESENTATION_MAX_BYTES });

    // Acima de 512 KB, que era o limite da 6b, e abaixo de 1 MiB: grava.
    const under = padded(doc, -4);
    expect(size(under)).toBeLessThanOrEqual(PRESENTATION_MAX_BYTES);
    expect(size(under)).toBeGreaterThan(PRESENTATION_MAX_BYTES - 8);
    const ok = await patch(a.id, { data: under });
    expect(ok.statusCode).toBe(200);
    stored = await row(a.id);
    expect(stored.data).toEqual(doc);
    expect(stored.pageCount).toBe(7);
  });

  it('corpo acima do que o servidor aceita continua recusado com 413', async () => {
    const a = await presentation('Enorme');
    const res = await patch(a.id, { data: { ...a.data, folga: 'x'.repeat(3 * 1024 * 1024) } });
    expect(res.statusCode).toBe(413);
    expect((await row(a.id)).updatedAt.toISOString()).toBe(a.updatedAt);
  });
});

describe('Fase 6c · E2 · permissões e conflito', () => {
  it('o leitor recebe 403 em toda gravação e continua lendo todas as páginas', async () => {
    const p = await project();
    const a = await presentation('Leitura', p.id);
    const doc = allTypes(a.data);
    expect((await patch(a.id, { data: doc })).statusCode).toBe(200);
    const img = await upload(a.id);
    const writes = [
      { method: 'POST' as const, url: '/presentations', payload: { name: 'Nova' } },
      { method: 'PATCH' as const, url: `/presentations/${a.id}`, payload: { data: doc } },
      { method: 'PATCH' as const, url: `/presentations/${a.id}`, payload: { name: 'Outro nome' } },
      { method: 'POST' as const, url: `/presentations/${a.id}/link`, payload: { projectId: p.id } },
      { method: 'POST' as const, url: `/presentations/${a.id}/pdf`, payload: {} },
      { method: 'POST' as const, url: `/presentations/${a.id}/images/uploads`, payload: { name: 'render.png', mimeType: 'image/png', size: 1000, width: 1600, height: 1131 } },
      { method: 'POST' as const, url: `/presentations/${a.id}/images/complete`, payload: { token: 'x', driveFileId: img.driveFileId } },
    ];
    for (const w of writes) {
      const res = await app.inject({ ...w, headers: viewer });
      expect(res.statusCode, `${w.method} ${w.url}`).toBe(403);
    }
    const stored = await row(a.id);
    expect(stored.data).toEqual(doc);
    expect(stored.pageCount).toBe(7);
    const view = await app.inject({ method: 'GET', url: `/presentations/${a.id}`, headers: viewer });
    expect(view.statusCode).toBe(200);
    expect(view.json().data).toEqual(doc);
  });

  it('conflito 409 continua: a versão antiga não sobrescreve a nova, e a resposta traz a atual', async () => {
    const a = await presentation('Conflito');
    const first = allTypes(a.data);
    const ok = await patch(a.id, { data: first, baseUpdatedAt: a.updatedAt });
    expect(ok.statusCode).toBe(200);

    // Outra aba ainda tem a versão de antes e tenta salvar só com a capa.
    const stale = await patch(a.id, { data: a.data, baseUpdatedAt: a.updatedAt });
    expect(stale.statusCode).toBe(409);
    expect(stale.json()).toMatchObject({ error: 'conflict', current: { id: a.id, updatedAt: ok.json().updatedAt, data: first } });
    const stored = await row(a.id);
    expect(stored.data).toEqual(first);
    expect(stored.pageCount).toBe(7);
  });
});

describe('Fase 6c · E6 · teto de 50 fotos por apresentação', () => {
  /** Capa e páginas "Várias imagens do ambiente" com as fotos dadas, 8 por página. */
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

  it('50 fotos gravam; a 51ª é recusada com o motivo, e nada muda', async () => {
    expect(PRESENTATION_MAX_PHOTOS).toBe(50);
    const a = await presentation('Muitas fotos');
    const imgs: string[] = [];
    for (let i = 0; i < 51; i++) imgs.push((await upload(a.id)).id);

    // A mesma foto em dois espaços conta uma vez só.
    const fifty = withPhotos(a.data, [...imgs.slice(0, 50), imgs[0]]);
    let res = await patch(a.id, { data: fifty });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toHaveLength(50);
    const savedAt = res.json().updatedAt;

    res = await patch(a.id, { data: withPhotos(a.data, imgs), baseUpdatedAt: savedAt });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'validation', fields: { data: 'too_many_photos' }, dataError: { reason: 'too_many_photos' }, count: 51, limit: 50 });
    expect(await usesOf(a.id)).toHaveLength(50);
    expect((await read(a.id)).updatedAt).toBe(savedAt);
  });

  it('documento que já passava do teto continua salvando enquanto não ganha foto nova', async () => {
    const a = await presentation('Documento antigo');
    const imgs: string[] = [];
    for (let i = 0; i < 51; i++) imgs.push((await upload(a.id)).id);
    // Simula um documento gravado antes do teto, direto no banco em memória.
    const old = withPhotos(a.data, imgs);
    await db.update(schema.presentations).set({ data: old as unknown as Record<string, unknown> }).where(eq(schema.presentations.id, a.id));

    const next = structuredClone(old);
    next.projeto.cliente = 'Cliente Avulso';
    const res = await patch(a.id, { data: next });
    expect(res.statusCode).toBe(200);
    expect(await usesOf(a.id)).toHaveLength(51);
  });
});
