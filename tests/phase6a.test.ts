// Testes da Fase 6a (decisões de 04/11/2026): API de orçamentos. Banco em memória (PGlite) e Drive
// simulado (FakeDrive): nenhum teste grava no banco de produção nem fala com o Google.
// Nenhum teste apaga ou altera linhas de audit_log; só lê.
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
import { emptyBudget, type BudgetData } from '../src/shared/budget-calc.js';
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

async function project(name = 'Apartamento 302') {
  const res = await app.inject({ method: 'POST', url: '/projects', headers: member, payload: { name, clientName: 'Cliente Exemplo' } });
  expect(res.statusCode).toBe(201);
  return res.json() as { id: string };
}

async function create(payload: Record<string, unknown>, headers: Headers = member) {
  return app.inject({ method: 'POST', url: '/budgets', headers, payload });
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action)).orderBy(asc(schema.auditLog.at));
}

/** Orçamento preenchido, com dados fictícios. */
const filled: BudgetData = {
  ...emptyBudget(),
  cliente: 'Cliente Exemplo',
  contatoCliente: '(00) 0 0000-0000',
  data: '2026-11-04',
  validade: '2026-12-04',
  imovel: 'Apartamento de 2 quartos',
  ambientes: [
    { nome: 'Sala', valor: 500 },
    { nome: 'Quarto', valor: 420.5 },
    { nome: 'Cozinha', valor: null },
  ],
  op2Todos: 400,
  op1Por: 150,
  op1Exec: 350,
  nota: false,
  cartao: 'Em até 10x com juros.',
  projetista: 'Projetista Exemplo',
  contatoProjetista: '(00) 0 0000-0001',
  email: 'estudio@exemplo.test',
  regiao: 'Região Exemplo',
};

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
  it('"Novo orçamento" dentro de um projeto: nasce zerado, numerado e no audit_log', async () => {
    const p = await project();
    const res = await create({ name: '  Proposta   inicial ', projectId: p.id });
    expect(res.statusCode).toBe(201);
    const b = res.json();
    expect(b).toMatchObject({ name: 'Proposta inicial', projectId: p.id, status: 'draft', totalCents: 0, createdBy: 'member' });
    expect(b.project).toMatchObject({ id: p.id, name: 'Apartamento 302' });
    expect(b.data).toEqual(emptyBudget());
    expect(typeof b.number).toBe('number');
    const log = await auditRows('budget.create');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ entity: 'budget', entityId: b.id, payload: { name: 'Proposta inicial', projectId: p.id } });
  });

  it('orçamento avulso (sem projeto) aparece só em "Sem projeto"', async () => {
    const p = await project();
    const avulso = (await create({ name: 'Avulso' })).json();
    const doProjeto = (await create({ name: 'Do projeto', projectId: p.id })).json();
    expect(avulso.projectId).toBeNull();

    const semProjeto = await app.inject({ method: 'GET', url: '/budgets?semProjeto=1', headers: viewer });
    expect(semProjeto.json().map((b: { id: string }) => b.id)).toEqual([avulso.id]);
    const doP = await app.inject({ method: 'GET', url: `/budgets?projectId=${p.id}`, headers: viewer });
    expect(doP.json().map((b: { id: string }) => b.id)).toEqual([doProjeto.id]);
    const todos = await app.inject({ method: 'GET', url: '/budgets', headers: viewer });
    expect(todos.json()).toHaveLength(2);
    // A lista não carrega o conteúdo, só o resumo.
    expect(todos.json()[0].data).toBeUndefined();
  });

  it('vários orçamentos no mesmo projeto, com números diferentes', async () => {
    const p = await project();
    const a = (await create({ name: 'Versão 1', projectId: p.id })).json();
    const b = (await create({ name: 'Versão 2', projectId: p.id })).json();
    expect(b.number).toBeGreaterThan(a.number);
    const list = await app.inject({ method: 'GET', url: `/budgets?projectId=${p.id}`, headers: member });
    expect(list.json()).toHaveLength(2);
  });

  it('criar um projeto não cria orçamento', async () => {
    await project();
    expect(await db.select().from(schema.budgets)).toHaveLength(0);
  });

  it('nome obrigatório: vazio, só espaços ou ausente não cria nada', async () => {
    for (const payload of [{}, { name: '' }, { name: '    ' }, { name: 42 }]) {
      const res = await create(payload);
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: 'validation', fields: { name: 'required' } });
    }
    const long = await create({ name: 'x'.repeat(121) });
    expect(long.json().fields).toEqual({ name: 'too_long' });
    expect(await db.select().from(schema.budgets)).toHaveLength(0);
    expect(await auditRows('budget.create')).toHaveLength(0);
  });

  it('projeto inexistente, inválido ou excluído é recusado', async () => {
    const p = await project();
    await app.inject({ method: 'DELETE', url: `/projects/${p.id}`, headers: admin });
    for (const projectId of [p.id, 'abc', '00000000-0000-0000-0000-000000000000']) {
      const res = await create({ name: 'Orçamento', projectId });
      expect(res.statusCode).toBe(400);
      expect(res.json().fields).toEqual({ projectId: 'not_found' });
    }
  });
});

describe('salvamento', () => {
  it('fechar e reabrir devolve os mesmos dados', async () => {
    const b = (await create({ name: 'Orçamento' })).json();
    const save = await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload: { data: filled, baseUpdatedAt: b.updatedAt } });
    expect(save.statusCode).toBe(200);
    expect(save.json().data).toEqual(filled);

    // "Fechar e reabrir": nova instância do servidor sobre o mesmo banco e nova leitura.
    await app.close();
    app = await buildApp({ config, db, drive: new FakeDrive(), calendar: new FakeCalendar() });
    const reopened = await app.inject({ method: 'GET', url: `/budgets/${b.id}`, headers: viewer });
    expect(reopened.statusCode).toBe(200);
    expect(reopened.json().data).toEqual(filled);
    expect(reopened.json().updatedAt).toBe(save.json().updatedAt);
  });

  it('a lista traz o cliente (do orçamento ou do projeto) e quem alterou por último', async () => {
    const p = await project();
    const doProjeto = (await create({ name: 'Do projeto', projectId: p.id })).json();
    const avulso = (await create({ name: 'Avulso' })).json();
    await app.inject({ method: 'PATCH', url: `/budgets/${avulso.id}`, headers: admin, payload: { data: filled } });
    const list = (await app.inject({ method: 'GET', url: '/budgets', headers: viewer })).json() as { id: string; clientName: string | null; updatedBy: string | null }[];
    const byId = new Map(list.map((b) => [b.id, b]));
    expect(byId.get(doProjeto.id)).toMatchObject({ clientName: 'Cliente Exemplo', updatedBy: 'member' });
    expect(byId.get(avulso.id)).toMatchObject({ clientName: 'Cliente Exemplo', updatedBy: ADMIN_EMAIL });
  });

  it('total_cents guarda o maior total, somando as linhas arredondadas', async () => {
    const b = (await create({ name: 'Orçamento' })).json();
    const res = await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload: { data: filled } });
    // Opção 01: 3 × 150 + 350 = 800,00. Opção 02: 500 + 420,50 + 0 = 920,50.
    expect(res.json().totalCents).toBe(92050);
    const [row] = await db.select().from(schema.budgets).where(eq(schema.budgets.id, b.id));
    expect(row.totalCents).toBe(92050);
  });

  it('cada salvamento registra no audit_log só o que mudou, sem copiar o conteúdo', async () => {
    const b = (await create({ name: 'Orçamento' })).json();
    await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload: { data: filled } });
    await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload: { name: 'Orçamento revisado' } });
    // Salvar sem mudança não grava nada.
    await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload: { data: filled } });
    const log = await auditRows('budget.update');
    expect(log.map((l) => l.payload)).toEqual([
      { changed: ['data'], totalCents: { from: 0, to: 92050 } },
      { changed: ['name'], name: { from: 'Orçamento', to: 'Orçamento revisado' }, totalCents: { from: 92050, to: 92050 } },
    ]);
    expect(JSON.stringify(log)).not.toContain('Cliente Exemplo');
  });

  it('salvamento sobre versão antiga (outra aba) responde 409 com a versão atual', async () => {
    const b = (await create({ name: 'Orçamento' })).json();
    const first = await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload: { data: filled, baseUpdatedAt: b.updatedAt } });
    expect(first.statusCode).toBe(200);
    const stale = await app.inject({
      method: 'PATCH',
      url: `/budgets/${b.id}`,
      headers: admin,
      payload: { data: { ...filled, cliente: 'Outra' }, baseUpdatedAt: b.updatedAt },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().current.data.cliente).toBe('Cliente Exemplo');
  });

  it('JSON inválido ou nome vazio não grava', async () => {
    const b = (await create({ name: 'Orçamento' })).json();
    for (const payload of [{ data: { op1: false, op2: false } }, { data: { ambientes: 'x' } }, { data: [] }, { name: ' ' }]) {
      const res = await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: member, payload });
      expect(res.statusCode).toBe(400);
    }
    const [row] = await db.select().from(schema.budgets).where(eq(schema.budgets.id, b.id));
    expect(row.name).toBe('Orçamento');
    expect(row.data).toEqual(emptyBudget());
  });

  it('orçamento de projeto excluído deixa de aparecer', async () => {
    const p = await project();
    const b = (await create({ name: 'Orçamento', projectId: p.id })).json();
    await app.inject({ method: 'DELETE', url: `/projects/${p.id}`, headers: admin });
    expect((await app.inject({ method: 'GET', url: `/budgets/${b.id}`, headers: member })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/budgets', headers: member })).json()).toHaveLength(0);
  });
});

describe('permissões', () => {
  it('administrador e colaborador criam e editam; leitor vê e não edita', async () => {
    const p = await project();
    expect((await create({ name: 'Do admin', projectId: p.id }, admin)).statusCode).toBe(201);
    const b = (await create({ name: 'Do colaborador' }, member)).json();

    const viewerCreate = await create({ name: 'Do leitor' }, viewer);
    expect(viewerCreate.statusCode).toBe(403);
    const viewerEdit = await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: viewer, payload: { data: filled } });
    expect(viewerEdit.statusCode).toBe(403);
    const adminEdit = await app.inject({ method: 'PATCH', url: `/budgets/${b.id}`, headers: admin, payload: { name: 'Editado' } });
    expect(adminEdit.statusCode).toBe(200);

    expect((await app.inject({ method: 'GET', url: `/budgets/${b.id}`, headers: viewer })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/budgets', headers: viewer })).statusCode).toBe(200);
    const [row] = await db.select().from(schema.budgets).where(eq(schema.budgets.id, b.id));
    expect(row.data).toEqual(emptyBudget());
    expect(await db.select().from(schema.budgets)).toHaveLength(2);
  });

  it('sem sessão, todas as rotas respondem 401', async () => {
    for (const [method, url] of [['GET', '/budgets'], ['GET', '/budgets/x'], ['POST', '/budgets'], ['PATCH', '/budgets/x']] as const) {
      expect((await app.inject({ method, url, payload: method === 'GET' ? undefined : {} })).statusCode).toBe(401);
    }
  });

  it('id inexistente ou inválido responde 404', async () => {
    for (const id of ['abc', '00000000-0000-0000-0000-000000000000']) {
      expect((await app.inject({ method: 'GET', url: `/budgets/${id}`, headers: member })).statusCode).toBe(404);
      expect((await app.inject({ method: 'PATCH', url: `/budgets/${id}`, headers: member, payload: { name: 'x' } })).statusCode).toBe(404);
    }
  });
});
