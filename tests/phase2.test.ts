// Testes da Fase 2 (ESPECIFICACAO.md, seções 5, 6 e 12): matriz de permissões e colaboradores.
// Banco em memória (PGlite), como na Fase 1. As sessões são criadas direto no banco.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import { PERMISSIONS, type Permission } from '../api/_app/permissions.js';

const ADMIN_EMAIL = 'admin@decroqui.test';
const ROLES = ['admin', 'member', 'viewer'] as const;
type Role = (typeof ROLES)[number];

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

/**
 * Linhas da matriz da seção 5. Cada linha aponta para a permissão do back-end que a protege e para
 * o resultado esperado por papel. "Entrar com Google" é coberto pelos testes da Fase 1.
 */
const MATRIX: { row: string; permission: Permission; method: 'GET' | 'POST'; expected: Record<Role, boolean> }[] = [
  { row: 'Ver colaboradores', permission: 'users.read', method: 'GET', expected: { admin: true, member: false, viewer: false } },
  { row: 'Convidar, alterar papel, desativar colaborador', permission: 'users.manage', method: 'POST', expected: { admin: true, member: false, viewer: false } },
  { row: 'Ver projetos, processos, agenda, dashboard', permission: 'workspace.read', method: 'GET', expected: { admin: true, member: true, viewer: true } },
  { row: 'Criar e editar projetos', permission: 'projects.write', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  { row: 'Arrastar projeto no Kanban (mudar etapa)', permission: 'projects.move', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  { row: 'Criar e editar eventos (ERP)', permission: 'events.write', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  // Fase 5
  { row: 'Conectar e desconectar o Google Agenda do estúdio', permission: 'calendar.connect', method: 'POST', expected: { admin: true, member: false, viewer: false } },
  { row: 'Criar, renomear, remover etapas', permission: 'stages.manage', method: 'POST', expected: { admin: true, member: false, viewer: false } },
  { row: 'Excluir projeto', permission: 'projects.delete', method: 'POST', expected: { admin: true, member: false, viewer: false } },
  { row: 'Criar e editar orçamento e apresentação', permission: 'documents.write', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  { row: 'Exportar PDF de orçamento e apresentação', permission: 'documents.export', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  // Fase 3b
  { row: 'Enviar arquivos e criar notas', permission: 'content.write', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  { row: 'Pedir exclusão de arquivo, nota ou projeto', permission: 'deletion.request', method: 'POST', expected: { admin: true, member: true, viewer: false } },
  { row: 'Excluir arquivo ou nota diretamente', permission: 'content.delete', method: 'POST', expected: { admin: true, member: false, viewer: false } },
  { row: 'Ver, aprovar e recusar pedidos de exclusão', permission: 'deletion.decide', method: 'POST', expected: { admin: true, member: false, viewer: false } },
  // Fase 3c
  { row: 'Ler e marcar as próprias notificações', permission: 'notifications.own', method: 'POST', expected: { admin: true, member: true, viewer: true } },
  // Página de Notificações
  { row: 'Enviar comunicado e ver comunicados enviados', permission: 'notifications.send', method: 'POST', expected: { admin: true, member: false, viewer: false } },
];

// Rotas de sonda: uma por linha da matriz, sob as mesmas regras de sessão e permissão das rotas reais.
// As telas dessas ações chegam nas próximas fases; a autorização já está fixada aqui.
const probes: FastifyPluginAsync = async (scope) => {
  for (const { permission, method } of MATRIX) {
    scope.route({ method, url: `/__probe/${permission}`, config: { permission }, handler: async () => ({ ok: true }) });
  }
};

let db: Db;
let app: FastifyInstance;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  app = await buildApp({ config, db, extraProtectedRoutes: probes });
});

afterEach(async () => {
  await app.close();
});

async function userWith(role: Role, status: 'active' | 'invited' | 'disabled' = 'active', email?: string) {
  if (role === 'admin' && status === 'active' && !email) {
    const [admin] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
    return admin;
  }
  const [u] = await db
    .insert(schema.users)
    .values({ email: email ?? `${role}-${randomToken(4)}@decroqui.test`, name: `Pessoa ${role}`, role, status })
    .returning();
  return u;
}

async function cookieFor(userId: string) {
  const { token } = await createSession(db, userId);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

async function as(role: Role) {
  const user = await userWith(role);
  return { user, headers: await cookieFor(user.id) };
}

async function auditRows(entityId: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.entityId, entityId));
}

describe('Matriz de permissões (seção 5), cada linha em cada papel', () => {
  for (const line of MATRIX) {
    for (const role of ROLES) {
      const allowed = line.expected[role];
      it(`${line.row} — ${role}: ${allowed ? 'permitido' : '403'}`, async () => {
        const { headers } = await as(role);
        const res = await app.inject({ method: line.method, url: `/__probe/${line.permission}`, headers });
        expect(res.statusCode).toBe(allowed ? 200 : 403);
      });
    }
  }

  it('a matriz do back-end é exatamente a da tabela acima', () => {
    const fromTable = Object.fromEntries(
      MATRIX.map((l) => [l.permission, ROLES.filter((r) => l.expected[r])]),
    );
    expect(fromTable).toEqual(Object.fromEntries(Object.entries(PERMISSIONS).map(([k, v]) => [k, [...v]])));
  });

  it('sem sessão, qualquer rota protegida responde 401 antes da permissão', async () => {
    const res = await app.inject({ method: 'POST', url: '/__probe/projects.write' });
    expect(res.statusCode).toBe(401);
  });

  it('o servidor não sobe com uma rota de escrita sem permissão declarada', async () => {
    const pg = new PGlite();
    const pgDb = drizzle(pg, { schema });
    await migrate(pgDb, { migrationsFolder: './drizzle' });
    const unsafe: FastifyPluginAsync = async (scope) => {
      scope.post('/sem-permissao', async () => ({ ok: true }));
    };
    await expect(buildApp({ config, db: pgDb as unknown as Db, extraProtectedRoutes: unsafe })).rejects.toThrow(
      /sem permissão declarada/,
    );
  });
});

describe('Rotas de colaboradores: só administrador', () => {
  const routes = (id: string) => [
    { method: 'GET' as const, url: '/users' },
    { method: 'POST' as const, url: '/users', payload: { email: 'x@decroqui.test', name: 'X', role: 'member' } },
    { method: 'PATCH' as const, url: `/users/${id}/role`, payload: { role: 'viewer' } },
    { method: 'POST' as const, url: `/users/${id}/disable` },
    { method: 'DELETE' as const, url: `/users/${id}` },
  ];

  for (const role of ['member', 'viewer'] as const) {
    it(`${role} recebe 403 em todas as rotas de colaboradores e nada muda`, async () => {
      const target = await userWith('member', 'invited');
      const { headers } = await as(role);
      for (const r of routes(target.id)) {
        const res = await app.inject({ ...r, headers });
        expect(res.statusCode, `${r.method} ${r.url}`).toBe(403);
      }
      const [after] = await db.select().from(schema.users).where(eq(schema.users.id, target.id));
      expect(after).toMatchObject({ role: 'member', status: 'invited' });
      expect(await db.select().from(schema.auditLog)).toHaveLength(0);
    });
  }

  it('sem sessão, todas respondem 401', async () => {
    const target = await userWith('member', 'invited');
    for (const r of routes(target.id)) {
      expect((await app.inject(r)).statusCode, `${r.method} ${r.url}`).toBe(401);
    }
  });
});

describe('Fase 2 — critérios de aceite (seção 12)', () => {
  it('admin convida: cria com status invited e registra no audit_log', async () => {
    const { user: admin, headers } = await as('admin');
    const res = await app.inject({
      method: 'POST',
      url: '/users',
      headers,
      payload: { email: '  Camila.Duarte@Gmail.com ', name: ' Camila Duarte ', role: 'member' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ email: 'camila.duarte@gmail.com', name: 'Camila Duarte', role: 'member', status: 'invited' });
    const [log] = await auditRows(res.json().id);
    expect(log).toMatchObject({ action: 'user.invite', entity: 'user', userId: admin.id });
    expect(log.payload).toMatchObject({ email: 'camila.duarte@gmail.com', role: 'member' });
  });

  it('admin altera papel e registra de/para no audit_log', async () => {
    const { headers } = await as('admin');
    const target = await userWith('member');
    const res = await app.inject({ method: 'PATCH', url: `/users/${target.id}/role`, headers, payload: { role: 'viewer' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().role).toBe('viewer');
    const [log] = await auditRows(target.id);
    expect(log).toMatchObject({ action: 'user.role_change' });
    expect(log.payload).toMatchObject({ from: 'member', to: 'viewer' });
  });

  it('admin desativa: status disabled, sessões encerradas na hora e registro no audit_log', async () => {
    const { headers } = await as('admin');
    const target = await userWith('member');
    const targetHeaders = await cookieFor(target.id);
    await cookieFor(target.id);
    expect((await app.inject({ method: 'GET', url: '/me', headers: targetHeaders })).statusCode).toBe(200);

    const res = await app.inject({ method: 'POST', url: `/users/${target.id}/disable`, headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('disabled');
    expect(await db.select().from(schema.sessions).where(eq(schema.sessions.userId, target.id))).toHaveLength(0);
    expect((await app.inject({ method: 'GET', url: '/me', headers: targetHeaders })).statusCode).toBe(401);
    const [log] = await auditRows(target.id);
    expect(log).toMatchObject({ action: 'user.disable' });
    expect(log.payload).toMatchObject({ sessionsEnded: 2 });
  });
});

describe('Colaboradores — regras', () => {
  it.each([
    ['e-mail vazio', { email: '', name: 'Ana', role: 'member' }, { email: 'required' }],
    ['e-mail inválido', { email: 'ana@', name: 'Ana', role: 'member' }, { email: 'invalid' }],
    ['nome vazio', { email: 'ana@decroqui.test', name: '   ', role: 'member' }, { name: 'required' }],
    ['papel inválido', { email: 'ana@decroqui.test', name: 'Ana', role: 'dono' }, { role: 'invalid' }],
    ['tudo ausente', {}, { email: 'required', name: 'required', role: 'invalid' }],
  ])('convite recusado com %s', async (_label, payload, fields) => {
    const { headers } = await as('admin');
    const res = await app.inject({ method: 'POST', url: '/users', headers, payload });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'validation', fields });
    expect(await db.select().from(schema.auditLog)).toHaveLength(0);
  });

  it('convite com e-mail já cadastrado responde 409', async () => {
    const { headers } = await as('admin');
    const res = await app.inject({ method: 'POST', url: '/users', headers, payload: { email: ADMIN_EMAIL.toUpperCase(), name: 'X', role: 'viewer' } });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('email_taken');
  });

  it('o administrador não altera o próprio papel', async () => {
    const { user, headers } = await as('admin');
    const res = await app.inject({ method: 'PATCH', url: `/users/${user.id}/role`, headers, payload: { role: 'member' } });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('self');
  });

  it('o último administrador ativo não é rebaixado, desativado nem removido', async () => {
    const { user, headers } = await as('admin');
    const demote = await app.inject({ method: 'PATCH', url: `/users/${user.id}/role`, headers, payload: { role: 'member' } });
    const disable = await app.inject({ method: 'POST', url: `/users/${user.id}/disable`, headers });
    const remove = await app.inject({ method: 'DELETE', url: `/users/${user.id}`, headers });
    for (const res of [demote, disable, remove]) expect(res.statusCode).toBe(409);
    const [after] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    expect(after).toMatchObject({ role: 'admin', status: 'active' });
  });

  it('com dois administradores, um pode rebaixar e desativar o outro', async () => {
    const { headers } = await as('admin');
    const other = await userWith('admin', 'active', 'outro.admin@decroqui.test');
    const demote = await app.inject({ method: 'PATCH', url: `/users/${other.id}/role`, headers, payload: { role: 'member' } });
    expect(demote.statusCode).toBe(200);
    const disable = await app.inject({ method: 'POST', url: `/users/${other.id}/disable`, headers });
    expect(disable.statusCode).toBe(200);
  });

  it('remover conta ativa é recusado; é preciso desativar antes', async () => {
    const { headers } = await as('admin');
    const target = await userWith('member');
    const res = await app.inject({ method: 'DELETE', url: `/users/${target.id}`, headers });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('invalid_status');
    expect(await db.select().from(schema.users).where(eq(schema.users.id, target.id))).toHaveLength(1);
  });

  it.each(['invited', 'disabled'] as const)('remove conta %s e mantém o registro no audit_log', async (status) => {
    const { headers } = await as('admin');
    const target = await userWith('viewer', status);
    const res = await app.inject({ method: 'DELETE', url: `/users/${target.id}`, headers });
    expect(res.statusCode).toBe(204);
    expect(await db.select().from(schema.users).where(eq(schema.users.id, target.id))).toHaveLength(0);
    const [log] = await auditRows(target.id);
    expect(log).toMatchObject({ action: 'user.remove' });
    expect(log.payload).toMatchObject({ email: target.email, status });
  });

  it('conta removida não entra mais: o convite deixa de existir', async () => {
    const { headers } = await as('admin');
    const target = await userWith('member', 'invited', 'saiu@decroqui.test');
    await app.inject({ method: 'DELETE', url: `/users/${target.id}`, headers });
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, 'saiu@decroqui.test'));
    expect(rows).toHaveLength(0);
  });

  it('id inexistente ou inválido responde 404', async () => {
    const { headers } = await as('admin');
    for (const id of ['00000000-0000-0000-0000-000000000000', 'nao-e-uuid']) {
      expect((await app.inject({ method: 'POST', url: `/users/${id}/disable`, headers })).statusCode).toBe(404);
      expect((await app.inject({ method: 'DELETE', url: `/users/${id}`, headers })).statusCode).toBe(404);
      expect(
        (await app.inject({ method: 'PATCH', url: `/users/${id}/role`, headers, payload: { role: 'viewer' } })).statusCode,
      ).toBe(404);
    }
  });

  it('a lista traz papel, situação e último acesso', async () => {
    const { headers } = await as('admin');
    await userWith('viewer', 'invited', 'camila@decroqui.test');
    const res = await app.inject({ method: 'GET', url: '/users', headers });
    expect(res.statusCode).toBe(200);
    const list = res.json() as { email: string; role: string; status: string; lastLoginAt: string | null }[];
    expect(list.map((u) => u.email)).toEqual([ADMIN_EMAIL, 'camila@decroqui.test']);
    expect(list[1]).toMatchObject({ role: 'viewer', status: 'invited', lastLoginAt: null });
  });
});
