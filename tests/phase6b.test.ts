// Testes da Fase 6b, etapa E3: API de apresentações (lista, leitura, criação e salvamento automático).
// Banco em memória (PGlite) e Drive simulado (FakeDrive): nenhum teste grava no banco de produção nem fala
// com o Google. Nenhum teste apaga ou altera linhas de audit_log; só lê.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { asc, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import { PRESENTATION_MAX_BYTES, parsePresentationData, type PresentationData } from '../src/shared/presentation-data.js';
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
type Headers = { cookie: string };
let admin: Headers;
let member: Headers;
let viewer: Headers;

async function login(userId: string): Promise<Headers> {
  const { token } = await createSession(db, userId);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

async function person(role: 'member' | 'viewer') {
  const [u] = await db.insert(schema.users).values({ email: `${role}@decroqui.test`, name: role, role, status: 'active' }).returning();
  return login(u.id);
}

async function project(name = 'Projeto Teste') {
  const res = await app.inject({ method: 'POST', url: '/projects', headers: member, payload: { name, clientName: 'Cliente Teste' } });
  expect(res.statusCode).toBe(201);
  return res.json() as { id: string };
}

async function create(payload: Record<string, unknown>, headers: Headers = member) {
  return app.inject({ method: 'POST', url: '/presentations', headers, payload });
}

async function patch(id: string, payload: Record<string, unknown>, headers: Headers = member) {
  return app.inject({ method: 'PATCH', url: `/presentations/${id}`, headers, payload });
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action)).orderBy(asc(schema.auditLog.at));
}

/** A mesma apresentação com a aba Projeto e a capa preenchidas, com dados fictícios. */
function filled(base: PresentationData): PresentationData {
  return {
    v: 1,
    projeto: {
      ...base.projeto,
      tipo: 'Residencial',
      cliente: 'Cliente Teste',
      projetista: 'Projetista Teste',
      localizacao: 'Cidade Teste',
      data: '2026-11-07',
      contato: '(00) 0 0000-0000',
    },
    paginas: [{ ...base.paginas[0], composicao: 'foto', cor: 'noite', marca: 'm' }],
  };
}

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  app = await buildApp({ config, db, drive: new FakeDrive(), calendar: new FakeCalendar() });
  const [a] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  admin = await login(a.id);
  member = await person('member');
  viewer = await person('viewer');
});

afterEach(async () => {
  await app.close();
});

describe('criação', () => {
  it('"Nova apresentação" no projeto: só a capa, zerada, com nome e cliente do projeto copiados', async () => {
    const p = await project();
    const res = await create({ name: '  Estudo   inicial ', projectId: p.id });
    expect(res.statusCode).toBe(201);
    const a = res.json();
    expect(a).toMatchObject({ name: 'Estudo inicial', projectId: p.id, pageCount: 1, createdBy: 'member', pdf: null });
    expect(a.project).toMatchObject({ id: p.id, name: 'Projeto Teste' });
    expect(typeof a.number).toBe('number');
    expect(a.data.projeto).toEqual({
      nome: 'Projeto Teste',
      tipo: '',
      cliente: 'Cliente Teste',
      projetista: '',
      registro: '',
      // O cadastro do projeto não tem localização.
      localizacao: '',
      data: '',
      codigo: '',
      marca: '',
      contato: '',
      formato: 'a4',
    });
    expect(a.data.paginas).toEqual([{ id: expect.any(String), tipo: 'capa', composicao: 'arco', cor: 'vinho', marca: 'p', imagem: null }]);
    expect('data' in parsePresentationData(a.data)).toBe(true);
    const log = await auditRows('presentation.create');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ entity: 'presentation', entityId: a.id, payload: { name: 'Estudo inicial', projectId: p.id } });
  });

  it('apresentação avulsa começa com todos os campos vazios e aparece só em "Sem projeto"', async () => {
    const p = await project();
    const avulsa = (await create({ name: 'Avulsa' })).json();
    const doProjeto = (await create({ name: 'Do projeto', projectId: p.id })).json();
    expect(avulsa.projectId).toBeNull();
    expect(Object.entries(avulsa.data.projeto).filter(([k, v]) => k !== 'formato' && v !== '')).toEqual([]);

    const semProjeto = await app.inject({ method: 'GET', url: '/presentations?semProjeto=1', headers: viewer });
    expect(semProjeto.json().map((x: { id: string }) => x.id)).toEqual([avulsa.id]);
    const doP = await app.inject({ method: 'GET', url: `/presentations?projectId=${p.id}`, headers: viewer });
    expect(doP.json().map((x: { id: string }) => x.id)).toEqual([doProjeto.id]);
    const todas = await app.inject({ method: 'GET', url: '/presentations', headers: viewer });
    expect(todas.json()).toHaveLength(2);
    // A lista não carrega o conteúdo, só o resumo.
    expect(todas.json()[0].data).toBeUndefined();
  });

  it('nada é criado sozinho: criar projeto não cria apresentação', async () => {
    await project();
    expect(await db.select().from(schema.presentations)).toHaveLength(0);
  });

  it('várias apresentações no mesmo projeto, com números diferentes', async () => {
    const p = await project();
    const a = (await create({ name: 'Versão 1', projectId: p.id })).json();
    const b = (await create({ name: 'Versão 2', projectId: p.id })).json();
    expect(b.number).toBeGreaterThan(a.number);
    expect(a.data.paginas[0].id).not.toBe(b.data.paginas[0].id);
  });

  it('nome obrigatório: vazio, só espaços, tabulação ou quebra de linha são recusados (400)', async () => {
    for (const name of ['', '   ', '\t\n', undefined, 42]) {
      const res = await create({ name });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: 'validation', fields: { name: 'required' } });
    }
    expect((await create({ name: 'x'.repeat(121) })).json().fields).toEqual({ name: 'too_long' });
    expect(await db.select().from(schema.presentations)).toHaveLength(0);
    expect(await auditRows('presentation.create')).toHaveLength(0);
  });

  it('projeto inexistente, inválido ou excluído é recusado', async () => {
    const p = await project();
    await app.inject({ method: 'DELETE', url: `/projects/${p.id}`, headers: admin });
    for (const projectId of [p.id, 'abc', '00000000-0000-0000-0000-000000000000', 7]) {
      const res = await create({ name: 'Apresentação', projectId });
      expect(res.statusCode).toBe(400);
      expect(res.json().fields).toEqual({ projectId: 'not_found' });
    }
    expect(await db.select().from(schema.presentations)).toHaveLength(0);
  });
});

describe('salvamento automático', () => {
  it('fechar e reabrir devolve o documento como foi deixado', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    const doc = filled(a.data);
    const save = await patch(a.id, { data: doc, baseUpdatedAt: a.updatedAt });
    expect(save.statusCode).toBe(200);
    expect(save.json().data).toEqual(doc);

    await app.close();
    app = await buildApp({ config, db, drive: new FakeDrive(), calendar: new FakeCalendar() });
    const reopened = await app.inject({ method: 'GET', url: `/presentations/${a.id}`, headers: viewer });
    expect(reopened.statusCode).toBe(200);
    expect(reopened.json().data).toEqual(doc);
    expect(reopened.json().updatedAt).toBe(save.json().updatedAt);
  });

  it('campos desconhecidos são descartados ao gravar', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    const res = await patch(a.id, { data: { ...a.data, extra: 1, projeto: { ...a.data.projeto, outro: 'x' } } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual(a.data);
  });

  it('a lista traz o cliente (da apresentação ou do projeto) e quem alterou por último', async () => {
    const p = await project();
    const doProjeto = (await create({ name: 'Do projeto', projectId: p.id })).json();
    const avulsa = (await create({ name: 'Avulsa' })).json();
    await patch(avulsa.id, { data: filled(avulsa.data) }, admin);
    const list = (await app.inject({ method: 'GET', url: '/presentations', headers: viewer })).json() as {
      id: string;
      clientName: string | null;
      updatedBy: string | null;
      pageCount: number;
    }[];
    const byId = new Map(list.map((x) => [x.id, x]));
    expect(byId.get(doProjeto.id)).toMatchObject({ clientName: 'Cliente Teste', updatedBy: 'member', pageCount: 1 });
    expect(byId.get(avulsa.id)).toMatchObject({ clientName: 'Cliente Teste', updatedBy: ADMIN_EMAIL });
  });

  it('cada salvamento registra no audit_log só o que mudou, sem copiar o conteúdo', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    await patch(a.id, { data: filled(a.data) });
    await patch(a.id, { name: 'Apresentação revisada' });
    // Salvar sem mudança não grava nada.
    await patch(a.id, { data: filled(a.data) });
    const log = await auditRows('presentation.update');
    expect(log.map((l) => l.payload)).toEqual([
      { changed: ['data'] },
      { changed: ['name'], name: { from: 'Apresentação', to: 'Apresentação revisada' } },
    ]);
    expect(JSON.stringify(log)).not.toContain('Cliente Teste');
  });

  it('salvamento sobre versão antiga (outra aba) responde 409 com a versão atual', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    const first = await patch(a.id, { data: filled(a.data), baseUpdatedAt: a.updatedAt });
    expect(first.statusCode).toBe(200);
    const other = filled(a.data);
    other.projeto.cliente = 'Outro Cliente';
    const stale = await patch(a.id, { data: other, baseUpdatedAt: a.updatedAt }, admin);
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error).toBe('conflict');
    expect(stale.json().current.data.projeto.cliente).toBe('Cliente Teste');
    const [row] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, a.id));
    expect((row.data as unknown as PresentationData).projeto.cliente).toBe('Cliente Teste');
  });

  it('documento acima de 512 KB não grava (413), e logo abaixo do limite grava', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    const size = (d: unknown) => Buffer.byteLength(JSON.stringify(d), 'utf8');
    // O limite vale para o documento como chega, em bytes UTF-8 (acentos contam 2).
    const padded = (extra: number) => {
      const d = { ...a.data, folga: '' };
      d.folga = 'é'.repeat(Math.floor((PRESENTATION_MAX_BYTES - size(d) + extra) / 2));
      return d;
    };
    const over = padded(2);
    expect(size(over)).toBeGreaterThan(PRESENTATION_MAX_BYTES);
    const huge = await patch(a.id, { data: over });
    expect(huge.statusCode).toBe(413);
    expect(huge.json()).toEqual({ error: 'too_large', size: size(over), limit: PRESENTATION_MAX_BYTES });

    // Corpo acima de 1 MiB: o próprio servidor recusa com 413, sem chegar à rota.
    const giant = await patch(a.id, { data: { ...a.data, folga: 'x'.repeat(1024 * 1024) } });
    expect(giant.statusCode).toBe(413);

    // Campo de texto acima de 2000 caracteres: 400.
    const tooLongField = await patch(a.id, { data: { ...a.data, projeto: { ...a.data.projeto, tipo: 'x'.repeat(2001) } } });
    expect(tooLongField.statusCode).toBe(400);

    let [row] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, a.id));
    expect(row.data).toEqual(a.data);
    expect(row.updatedAt.toISOString()).toBe(a.updatedAt);

    // Logo abaixo do limite, grava (o campo desconhecido de folga é descartado).
    const doc = filled(a.data);
    const under = { ...doc, folga: padded(-(size(doc) - size(a.data)) - 4).folga };
    expect(size(under)).toBeLessThanOrEqual(PRESENTATION_MAX_BYTES);
    expect(size(under)).toBeGreaterThan(PRESENTATION_MAX_BYTES - 8);
    const ok = await patch(a.id, { data: under });
    expect(ok.statusCode).toBe(200);
    [row] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, a.id));
    expect(row.data).toEqual(doc);
  });

  it('JSON inválido, página fora da 6b, data inválida, texto em base64 ou nome vazio não gravam', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    const capa = a.data.paginas[0];
    const bad = [
      { data: [] },
      { data: { ...a.data, v: 2 } },
      { data: { ...a.data, paginas: [] } },
      { data: { ...a.data, paginas: [capa, { ...capa, id: 'p2', tipo: 'notas' }] } },
      { data: { ...a.data, paginas: [{ ...capa, cor: 'verde' }] } },
      { data: { ...a.data, paginas: [{ ...capa, composicao: 'grade' }] } },
      { data: { ...a.data, projeto: { ...a.data.projeto, formato: 'a3' } } },
      { data: { ...a.data, projeto: { ...a.data.projeto, data: '07/11/2026' } } },
      { data: { ...a.data, projeto: { ...a.data.projeto, marca: 7 } } },
      { data: { ...a.data, paginas: [{ ...capa, imagem: { id: 'x', ajuste: 'fit', zoom: 1, x: 50, y: 50 } }] } },
      { name: ' ' },
      { name: '\n\t' },
    ];
    for (const payload of bad) {
      const res = await patch(a.id, payload);
      expect(res.statusCode, JSON.stringify(payload).slice(0, 80)).toBe(400);
    }
    const b64 = await patch(a.id, { data: { ...a.data, projeto: { ...a.data.projeto, marca: 'data:image/png;base64,iVBORw0KGgo=' } } });
    expect(b64.statusCode).toBe(400);
    expect(b64.json().fields).toEqual({ data: 'base64' });

    const [row] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, a.id));
    expect(row.name).toBe('Apresentação');
    expect(row.data).toEqual(a.data);
    expect(await auditRows('presentation.update')).toHaveLength(0);
  });

  it('imagem que não está na biblioteca da apresentação é recusada', async () => {
    const p = await project();
    const a = (await create({ name: 'Do projeto', projectId: p.id })).json();
    const outra = (await create({ name: 'Avulsa' })).json();
    // Imagem da biblioteca de outra apresentação (avulsa) e imagem do projeto que já foi para a lixeira.
    const [deOutra] = await db
      .insert(schema.presentationImages)
      .values({ ownerPresentationId: outra.id, driveFileId: 'f1', fileName: 'a.png', mimeType: 'image/png', widthPx: 10, heightPx: 10, sizeBytes: 10 })
      .returning();
    const [naLixeira] = await db
      .insert(schema.presentationImages)
      .values({ projectId: p.id, driveFileId: 'f2', fileName: 'b.png', mimeType: 'image/png', widthPx: 10, heightPx: 10, sizeBytes: 10, trashedAt: new Date() })
      .returning();
    const [doProjeto] = await db
      .insert(schema.presentationImages)
      .values({ projectId: p.id, driveFileId: 'f3', fileName: 'c.png', mimeType: 'image/png', widthPx: 10, heightPx: 10, sizeBytes: 10 })
      .returning();
    const withImage = (id: string) => ({
      data: { ...a.data, paginas: [{ ...a.data.paginas[0], imagem: { id, ajuste: 'fill', zoom: 1.15, x: 50, y: 40 } }] },
    });
    for (const id of [deOutra.id, naLixeira.id, '00000000-0000-0000-0000-000000000000']) {
      const res = await patch(a.id, withImage(id));
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ fields: { data: 'image_not_in_library' }, images: [id] });
    }
    const ok = await patch(a.id, withImage(doProjeto.id));
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data.paginas[0].imagem).toEqual({ id: doProjeto.id, ajuste: 'fill', zoom: 1.15, x: 50, y: 40 });
  });

  it('apresentação de projeto excluído responde 404 e some da lista', async () => {
    const p = await project();
    const a = (await create({ name: 'Apresentação', projectId: p.id })).json();
    await app.inject({ method: 'DELETE', url: `/projects/${p.id}`, headers: admin });
    expect((await app.inject({ method: 'GET', url: `/presentations/${a.id}`, headers: member })).statusCode).toBe(404);
    expect((await patch(a.id, { name: 'Outro' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/presentations', headers: member })).json()).toHaveLength(0);
    expect((await app.inject({ method: 'GET', url: `/presentations?projectId=${p.id}`, headers: member })).statusCode).toBe(404);
  });

  it('id inexistente ou inválido responde 404', async () => {
    for (const id of ['abc', '00000000-0000-0000-0000-000000000000']) {
      expect((await app.inject({ method: 'GET', url: `/presentations/${id}`, headers: member })).statusCode).toBe(404);
      expect((await patch(id, { name: 'X' })).statusCode).toBe(404);
    }
  });
});

describe('permissões', () => {
  it('administrador e colaborador criam e editam; leitor vê e recebe 403 em toda gravação', async () => {
    const p = await project();
    expect((await create({ name: 'Do admin', projectId: p.id }, admin)).statusCode).toBe(201);
    const a = (await create({ name: 'Do colaborador' }, member)).json();

    expect((await create({ name: 'Do leitor' }, viewer)).statusCode).toBe(403);
    expect((await create({ name: 'Do leitor', projectId: p.id }, viewer)).statusCode).toBe(403);
    expect((await patch(a.id, { data: filled(a.data) }, viewer)).statusCode).toBe(403);
    expect((await patch(a.id, { name: 'Pelo leitor' }, viewer)).statusCode).toBe(403);
    expect((await patch(a.id, { name: 'Editado' }, admin)).statusCode).toBe(200);

    expect((await app.inject({ method: 'GET', url: `/presentations/${a.id}`, headers: viewer })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/presentations', headers: viewer })).statusCode).toBe(200);
    const [row] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, a.id));
    expect(row.data).toEqual(a.data);
    expect(row.name).toBe('Editado');
    expect(await db.select().from(schema.presentations)).toHaveLength(2);
  });

  it('sem sessão, todas as rotas respondem 401', async () => {
    const a = (await create({ name: 'Apresentação' })).json();
    for (const r of [
      { method: 'GET' as const, url: '/presentations' },
      { method: 'GET' as const, url: `/presentations/${a.id}` },
      { method: 'POST' as const, url: '/presentations', payload: { name: 'X' } },
      { method: 'PATCH' as const, url: `/presentations/${a.id}`, payload: { name: 'X' } },
    ]) {
      expect((await app.inject(r)).statusCode, `${r.method} ${r.url}`).toBe(401);
    }
  });
});
