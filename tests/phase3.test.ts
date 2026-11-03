// Testes da Fase 3 (ESPECIFICACAO.md, seções 4, 5, 7 e 12): projetos e Google Drive.
// Banco em memória (PGlite) e um Drive falso em memória; o Drive real é testado à mão, com a conta do administrador.
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
import { PROJECT_SUBFOLDERS } from '../api/_app/drive.js';
import { FakeDrive } from './fake-drive.js';

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

let db: Db;
let app: FastifyInstance;
let drive: FakeDrive;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  drive = new FakeDrive();
  app = await buildApp({ config, db, drive });
});

afterEach(async () => {
  await app.close();
});

async function userWith(role: Role) {
  if (role === 'admin') {
    const [admin] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
    return admin;
  }
  const [u] = await db
    .insert(schema.users)
    .values({ email: `${role}-${randomToken(4)}@decroqui.test`, name: `Pessoa ${role}`, role, status: 'active' })
    .returning();
  return u;
}

async function as(role: Role) {
  const user = await userWith(role);
  const { token } = await createSession(db, user.id);
  return { user, headers: { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` } };
}

async function createProject(headers: Record<string, string>, payload: Record<string, unknown> = {}) {
  return app.inject({
    method: 'POST',
    url: '/projects',
    headers,
    payload: { name: 'Casa Alecrim', clientName: 'Helena Prado', deadline: '2026-12-15', ...payload },
  });
}

async function projectRows() {
  return db.select().from(schema.projects);
}

async function auditFor(entityId: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.entityId, entityId)).orderBy(asc(schema.auditLog.at));
}

describe('Migração: etapas padrão', () => {
  it('cria as sete etapas, na ordem da seção 4', async () => {
    const rows = await db.select().from(schema.stages).orderBy(asc(schema.stages.position));
    expect(rows.map((s) => s.name)).toEqual(['Briefing', 'Levantamento', 'Projeto', 'Orçamento', 'Aprovação', 'Execução', 'Entrega']);
    expect(rows.map((s) => s.position)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

/**
 * Linhas da matriz da seção 5 que esta fase usa, cada uma com a rota real que a protege.
 * Para as rotas de escrita, a negação também confere que o Drive não foi tocado.
 */
const PROJECT_MATRIX = [
  { row: 'Ver projetos (lista)', permission: 'workspace.read', route: 'GET /projects', expected: { admin: true, member: true, viewer: true } },
  { row: 'Ver projetos (projeto aberto)', permission: 'workspace.read', route: 'GET /projects/:id', expected: { admin: true, member: true, viewer: true } },
  { row: 'Criar projetos', permission: 'projects.write', route: 'POST /projects', expected: { admin: true, member: true, viewer: false } },
  { row: 'Editar projetos (renomear)', permission: 'projects.write', route: 'PATCH /projects/:id', expected: { admin: true, member: true, viewer: false } },
  { row: 'Excluir projeto', permission: 'projects.delete', route: 'DELETE /projects/:id', expected: { admin: true, member: false, viewer: false } },
] as const;

describe('Permissões de projetos (seção 5), cada linha em cada papel', () => {
  for (const line of PROJECT_MATRIX) {
    for (const role of ROLES) {
      const allowed = line.expected[role];
      it(`${line.row} — ${role}: ${allowed ? 'permitido' : '403'}`, async () => {
        const admin = await as('admin');
        const seed = await createProject(admin.headers);
        const id = seed.json().id as string;
        const { headers } = await as(role);
        drive.resetCalls();
        const [method, path] = line.route.split(' ') as ['GET' | 'POST' | 'PATCH' | 'DELETE', string];
        const url = path.replace(':id', id);
        const payload =
          method === 'POST' ? { name: 'Casa Figueira', clientName: 'Teresa Albuquerque' } : method === 'PATCH' ? { name: 'Casa Alecrim II' } : undefined;
        const before = (await projectRows()).length;

        const res = await app.inject({ method, url, headers, payload });

        const ok = { GET: 200, POST: 201, PATCH: 200, DELETE: 204 }[method];
        expect(res.statusCode).toBe(allowed ? ok : 403);
        if (!allowed) {
          expect(drive.calls).toEqual([]);
          expect(await projectRows()).toHaveLength(before);
          const [p] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
          expect(p.name).toBe('Casa Alecrim');
          expect(p.deletedAt).toBeNull();
        }
      });
    }
  }

  it('sem sessão, as rotas de projetos respondem 401', async () => {
    for (const [method, url] of [
      ['GET', '/projects'],
      ['POST', '/projects'],
      ['PATCH', '/projects/00000000-0000-0000-0000-000000000000'],
      ['DELETE', '/projects/00000000-0000-0000-0000-000000000000'],
    ] as const) {
      expect((await app.inject({ method, url })).statusCode).toBe(401);
    }
    expect(drive.calls).toEqual([]);
  });
});

describe('Criar projeto (aceite: cria a pasta no Drive com as subpastas)', () => {
  it('cria "De.Croqui ERP/Projetos/<cliente> - <projeto>" com Orçamentos, Apresentações, Contratos, Fotos e Arquivos', async () => {
    const { user, headers } = await as('member');
    const res = await createProject(headers);
    expect(res.statusCode).toBe(201);
    const body = res.json();

    const [root] = drive.byName('De.Croqui ERP');
    expect(root.parentId).toBeNull();
    const [projetos] = drive.childrenOf(root.id);
    expect(projetos.name).toBe('Projetos');
    const [folder] = drive.childrenOf(projetos.id);
    expect(folder.name).toBe('Helena Prado - Casa Alecrim');
    expect(drive.childrenOf(folder.id).map((f) => f.name)).toEqual([...PROJECT_SUBFOLDERS]);
    expect(PROJECT_SUBFOLDERS).toEqual(['Orçamentos', 'Apresentações', 'Contratos', 'Fotos', 'Arquivos']);

    expect(body.driveFolderId).toBe(folder.id);
    expect(body.driveUrl).toBe(`https://drive.google.com/drive/folders/${folder.id}`);
    expect(body.stage.name).toBe('Briefing');
    expect(body.status).toBe('active');
    expect(body.deadline).toBe('2026-12-15');
    expect(body.updatedBy).toBe(user.name);

    const [row] = await projectRows();
    expect(row.driveFolderId).toBe(folder.id);
    expect(row.ownerUserId).toBe(user.id);
  });

  it('a pasta raiz é criada uma vez e o ID fica guardado em configuração', async () => {
    const { headers } = await as('admin');
    await createProject(headers);
    await createProject(headers, { name: 'Casa Figueira', clientName: 'Teresa Albuquerque' });
    expect(drive.byName('De.Croqui ERP')).toHaveLength(1);
    expect(drive.byName('Projetos')).toHaveLength(1);
    const settings = await db.select().from(schema.appSettings);
    const root = settings.find((s) => s.key === 'drive_root_folder_id');
    expect(root?.value).toBe(drive.byName('De.Croqui ERP')[0].id);
  });

  it('se a pasta raiz for apagada no Drive, ela é criada de novo', async () => {
    const { headers } = await as('admin');
    await createProject(headers);
    const [oldRoot] = drive.byName('De.Croqui ERP');
    await drive.trashFolder(oldRoot.id);
    for (const f of drive.childrenOf(oldRoot.id)) f.trashed = true;
    expect((await createProject(headers, { name: 'Casa Figueira' })).statusCode).toBe(201);
    expect(drive.byName('De.Croqui ERP')).toHaveLength(1);
    expect(drive.byName('De.Croqui ERP')[0].id).not.toBe(oldRoot.id);
  });

  it('grava no audit_log quem criou, os dados e o ID da pasta', async () => {
    const { user, headers } = await as('member');
    const body = (await createProject(headers)).json();
    const [entry] = await auditFor(body.id);
    expect(entry).toMatchObject({ userId: user.id, action: 'project.create', entity: 'project' });
    expect(entry.payload).toMatchObject({ name: 'Casa Alecrim', clientName: 'Helena Prado', driveFolderId: body.driveFolderId });
  });

  it('valida nome, cliente e prazo antes de tocar no Drive', async () => {
    const { headers } = await as('admin');
    const res = await createProject(headers, { name: '  ', clientName: 'x'.repeat(121), deadline: '2026-02-30' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'validation', fields: { name: 'required', clientName: 'too_long', deadline: 'invalid' } });
    expect(drive.calls).toEqual([]);
  });

  it('o prazo é opcional', async () => {
    const { headers } = await as('admin');
    const res = await createProject(headers, { deadline: '' });
    expect(res.statusCode).toBe(201);
    expect(res.json().deadline).toBeNull();
  });
});

describe('Falha no Drive não salva o projeto (aceite)', () => {
  for (const [label, failOn] of [
    ['ao criar a pasta raiz', { op: 'createFolder', nth: 1 }],
    ['ao criar a pasta do projeto', { op: 'createFolder', nth: 3 }],
    ['ao criar uma subpasta', { op: 'createFolder', nth: 5 }],
  ] as const) {
    it(`${label}: responde 502, não grava projeto nem audit_log`, async () => {
      const { headers } = await as('admin');
      drive.failOn = failOn;
      const res = await createProject(headers);
      expect(res.statusCode).toBe(502);
      expect(res.json()).toEqual({ error: 'drive_failed' });
      expect(await projectRows()).toHaveLength(0);
      expect(await db.select().from(schema.auditLog)).toHaveLength(0);
      // A pasta do projeto criada pela metade vai para a lixeira, para a nova tentativa não duplicar.
      expect(drive.byName('Helena Prado - Casa Alecrim')).toHaveLength(0);
    });
  }

  it('depois da falha, tentar de novo funciona', async () => {
    const { headers } = await as('admin');
    drive.failOn = { op: 'createFolder', nth: 3 };
    expect((await createProject(headers)).statusCode).toBe(502);
    drive.failOn = null;
    expect((await createProject(headers)).statusCode).toBe(201);
    expect(await projectRows()).toHaveLength(1);
    expect(drive.byName('Helena Prado - Casa Alecrim')).toHaveLength(1);
  });
});

describe('Renomear projeto (aceite: mantém o drive_folder_id)', () => {
  it('renomeia a pasta no Drive e mantém o mesmo ID', async () => {
    const { headers } = await as('member');
    const created = (await createProject(headers)).json();
    const res = await app.inject({
      method: 'PATCH',
      url: `/projects/${created.id}`,
      headers,
      payload: { name: 'Casa Alecrim Reforma', clientName: 'Helena e Caio Prado' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().driveFolderId).toBe(created.driveFolderId);
    expect(drive.folders.get(created.driveFolderId)?.name).toBe('Helena e Caio Prado - Casa Alecrim Reforma');
    const [row] = await projectRows();
    expect(row.driveFolderId).toBe(created.driveFolderId);
    expect(row.name).toBe('Casa Alecrim Reforma');
    expect(drive.childrenOf(created.driveFolderId)).toHaveLength(5);
  });

  it('grava no audit_log o antes e o depois', async () => {
    const { user, headers } = await as('member');
    const created = (await createProject(headers)).json();
    await app.inject({ method: 'PATCH', url: `/projects/${created.id}`, headers, payload: { name: 'Casa Alecrim Reforma' } });
    const entries = await auditFor(created.id);
    expect(entries.map((e) => e.action)).toEqual(['project.create', 'project.update']);
    expect(entries[1].userId).toBe(user.id);
    expect(entries[1].payload).toMatchObject({
      changes: { name: { from: 'Casa Alecrim', to: 'Casa Alecrim Reforma' } },
      folderRenamed: true,
    });
  });

  it('mudar só o prazo não mexe no Drive', async () => {
    const { headers } = await as('admin');
    const created = (await createProject(headers)).json();
    drive.resetCalls();
    const res = await app.inject({ method: 'PATCH', url: `/projects/${created.id}`, headers, payload: { deadline: '2027-01-20' } });
    expect(res.json().deadline).toBe('2027-01-20');
    expect(drive.calls).toEqual([]);
  });

  it('se o Drive falhar ao renomear, o banco não muda', async () => {
    const { headers } = await as('admin');
    const created = (await createProject(headers)).json();
    drive.failOn = { op: 'renameFolder' };
    const res = await app.inject({ method: 'PATCH', url: `/projects/${created.id}`, headers, payload: { name: 'Outro nome' } });
    expect(res.statusCode).toBe(502);
    const [row] = await projectRows();
    expect(row.name).toBe('Casa Alecrim');
    expect((await auditFor(created.id)).map((e) => e.action)).toEqual(['project.create']);
  });
});

describe('Excluir projeto: sai do ERP e a pasta vai para a lixeira do Drive (Fase 3c)', () => {
  it('marca deleted_at, some da lista, manda a pasta para a lixeira e registra no audit_log', async () => {
    const admin = await as('admin');
    const created = (await createProject(admin.headers)).json();
    drive.resetCalls();
    const res = await app.inject({ method: 'DELETE', url: `/projects/${created.id}`, headers: admin.headers });
    expect(res.statusCode).toBe(204);
    expect(drive.calls).toEqual(['trashFolder']);
    expect(drive.folders.get(created.driveFolderId)?.trashed).toBe(true);

    const [row] = await projectRows();
    expect(row.deletedAt).not.toBeNull();
    expect((await app.inject({ method: 'GET', url: '/projects', headers: admin.headers })).json()).toEqual([]);
    expect((await app.inject({ method: 'GET', url: `/projects/${created.id}`, headers: admin.headers })).statusCode).toBe(404);
    expect((await app.inject({ method: 'PATCH', url: `/projects/${created.id}`, headers: admin.headers, payload: { name: 'x' } })).statusCode).toBe(404);

    const entries = await auditFor(created.id);
    expect(entries.at(-1)).toMatchObject({ action: 'project.delete', userId: admin.user.id });
    expect(entries.at(-1)?.payload).toMatchObject({ driveFolderId: created.driveFolderId, trashedInDrive: true });
  });
});

describe('Lista de projetos', () => {
  it('ordena pela última alteração e mostra quem alterou', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const a = (await createProject(admin.headers, { name: 'Casa Alecrim' })).json();
    await createProject(admin.headers, { name: 'Casa Figueira' });
    await app.inject({ method: 'PATCH', url: `/projects/${a.id}`, headers: member.headers, payload: { deadline: '2027-03-01' } });

    const list = (await app.inject({ method: 'GET', url: '/projects', headers: (await as('viewer')).headers })).json();
    expect(list.map((p: { name: string }) => p.name)).toEqual(['Casa Alecrim', 'Casa Figueira']);
    expect(list[0].updatedBy).toBe(member.user.name);
  });

  it('id inválido responde 404', async () => {
    const { headers } = await as('admin');
    expect((await app.inject({ method: 'GET', url: '/projects/nao-existe', headers })).statusCode).toBe(404);
  });
});
