// Testes da Fase 3c: imagem pelo servidor, categoria Arquivos, lixeira da pasta do projeto,
// compartilhamento automático do Drive e notificações. Banco em memória (PGlite) e Drive falso.
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
import { FakeDrive } from './fake-drive.js';

const ADMIN_EMAIL = 'admin@decroqui.test';
const ROLES = ['admin', 'member', 'viewer'] as const;
type Role = (typeof ROLES)[number];
type Headers = Record<string, string>;
const MB = 1024 * 1024;

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

/** Sessão para um papel. `admin` sem e-mail é a conta dona (ADMIN_EMAIL); com e-mail, outro administrador. */
async function as(role: Role, email?: string) {
  let user;
  if (role === 'admin' && !email) {
    [user] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  } else {
    [user] = await db
      .insert(schema.users)
      .values({ email: email ?? `${role}-${randomToken(4)}@decroqui.test`, name: `Pessoa ${role}`, role, status: 'active' })
      .returning();
  }
  const { token } = await createSession(db, user.id);
  return { user, headers: { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` } as Headers };
}

function inject(method: string, url: string, headers: Headers, payload?: unknown) {
  return app.inject({ method: method as 'GET', url, headers, ...(payload === undefined ? {} : { payload: payload as object }) });
}

async function newProject(headers: Headers, name = 'Casa Alecrim') {
  const res = await inject('POST', '/projects', headers, { name, clientName: 'Helena Prado' });
  return res.json() as { id: string; driveFolderId: string };
}

function subfolderOf(projectFolderId: string, name: string) {
  return drive.childrenOf(projectFolderId).find((f) => f.name === name);
}

async function upload(headers: Headers, projectId: string, file: { name: string; mimeType: string; size: number; subfolder: string }) {
  const session = await inject('POST', `/projects/${projectId}/uploads`, headers, file);
  const { uploadUrl, token } = session.json();
  const driveFileId = drive.browserUpload(uploadUrl);
  const done = await inject('POST', `/projects/${projectId}/uploads/complete`, headers, { token, driveFileId });
  return { session, done, driveFileId, uploadUrl };
}

async function notificationsOf(userId: string) {
  return db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId));
}

function rootFolderId() {
  return drive.byName('De.Croqui ERP')[0]?.id;
}

// ---------------------------------------------------------------------------------------------

describe('Imagem pelo servidor do ERP (aceite: imagem no celular carrega pelo servidor)', () => {
  it('serve a imagem grande gerada pelo Drive, para todos os papéis, sem link do Drive', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    const { done } = await upload(admin.headers, project.id, { name: 'fachada.heic', mimeType: 'image/heic', size: 8 * MB, subfolder: 'photos' });
    const file = done.json();
    expect(file.previewUrl).toBeUndefined();

    for (const role of ROLES) {
      const { headers } = await as(role);
      drive.thumbnailSizes = [];
      const res = await inject('GET', `/files/${file.id}/image`, headers);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
      expect(res.headers['cache-control']).toBe('private, max-age=3600');
      expect(drive.thumbnailSizes).toEqual([1600]);
    }
  });

  it('a miniatura da lista continua pequena', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    const { done } = await upload(admin.headers, project.id, { name: 'sala.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' });
    drive.thumbnailSizes = [];
    expect((await inject('GET', `/files/${done.json().id}/thumbnail`, admin.headers)).statusCode).toBe(200);
    expect(drive.thumbnailSizes).toEqual([220]);
  });

  it('sem imagem gerada pelo Drive: passa o original só até 4 MB', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    const small = await upload(admin.headers, project.id, { name: 'detalhe.png', mimeType: 'image/png', size: 3 * MB, subfolder: 'photos' });
    const big = await upload(admin.headers, project.id, { name: 'panorama.png', mimeType: 'image/png', size: 9 * MB, subfolder: 'photos' });
    drive.noThumbnail.add(small.driveFileId);
    drive.noThumbnail.add(big.driveFileId);
    const ok = await inject('GET', `/files/${small.done.json().id}/image`, admin.headers);
    expect(ok.statusCode).toBe(200);
    expect(ok.headers['content-type']).toBe('image/png');
    expect((await inject('GET', `/files/${big.done.json().id}/image`, admin.headers)).statusCode).toBe(404);
  });

  it('PDF e CAD não passam por esta rota (continuam com Abrir no Drive)', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    const { done } = await upload(admin.headers, project.id, { name: 'planta.pdf', mimeType: 'application/pdf', size: 1000, subfolder: 'contracts' });
    drive.resetCalls();
    expect((await inject('GET', `/files/${done.json().id}/image`, admin.headers)).statusCode).toBe(404);
    expect(drive.calls).toEqual([]);
  });

  it('sem sessão: 401', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    const { done } = await upload(admin.headers, project.id, { name: 'sala.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' });
    expect((await app.inject({ method: 'GET', url: `/files/${done.json().id}/image` })).statusCode).toBe(401);
  });
});

describe('Categoria Arquivos (aceite: CAD e SketchUp vão para Arquivos)', () => {
  it('projeto novo já nasce com a subpasta Arquivos', async () => {
    const { headers } = await as('member');
    const project = await newProject(headers);
    expect(drive.childrenOf(project.driveFolderId).map((f) => f.name)).toEqual(['Orçamentos', 'Apresentações', 'Contratos', 'Fotos', 'Arquivos']);
  });

  it('DWG sem tipo do navegador e SKP vão para Arquivos, com o nome original', async () => {
    const { headers } = await as('member');
    const project = await newProject(headers);
    const arquivos = subfolderOf(project.driveFolderId, 'Arquivos')!;
    for (const name of ['planta-executiva.dwg', 'modelo-sala.skp']) {
      const { session, done } = await upload(headers, project.id, { name, mimeType: '', size: 40 * MB, subfolder: 'files' });
      expect(session.statusCode).toBe(201);
      expect(drive.sessions.get(session.json().uploadUrl)!.parentId).toBe(arquivos.id);
      expect(drive.sessions.get(session.json().uploadUrl)!.mimeType).toBe('application/octet-stream');
      expect(done.statusCode).toBe(201);
      expect(done.json()).toMatchObject({ name, subfolder: 'files', hasThumbnail: false });
    }
    const list = (await inject('GET', `/projects/${project.id}/files`, headers)).json();
    expect(list.map((f: { subfolder: string }) => f.subfolder)).toEqual(['files', 'files']);
  });

  it('projeto criado antes da Fase 3c: a subpasta Arquivos é criada no primeiro envio', async () => {
    const { headers } = await as('member');
    const project = await newProject(headers);
    const old = subfolderOf(project.driveFolderId, 'Arquivos')!;
    drive.folders.delete(old.id);
    const { session } = await upload(headers, project.id, { name: 'corte.dwg', mimeType: '', size: 1000, subfolder: 'files' });
    const created = subfolderOf(project.driveFolderId, 'Arquivos')!;
    expect(created.id).not.toBe(old.id);
    expect(drive.sessions.get(session.json().uploadUrl)!.parentId).toBe(created.id);
  });

  it('somente leitura não envia para Arquivos', async () => {
    const admin = await as('admin');
    const viewer = await as('viewer');
    const project = await newProject(admin.headers);
    drive.resetCalls();
    const res = await inject('POST', `/projects/${project.id}/uploads`, viewer.headers, { name: 'a.dwg', size: 10, subfolder: 'files' });
    expect(res.statusCode).toBe(403);
    expect(drive.calls).toEqual([]);
  });
});

describe('Excluir projeto manda a pasta para a lixeira do Drive (aceite)', () => {
  it('exclusão direta: pasta na lixeira, nunca apagada de vez', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    drive.resetCalls();
    expect((await inject('DELETE', `/projects/${project.id}`, admin.headers)).statusCode).toBe(204);
    expect(drive.calls).toEqual(['trashFolder']);
    expect(drive.folders.get(project.driveFolderId)).toMatchObject({ trashed: true });
    const [p] = await db.select().from(schema.projects);
    expect(p.deletedAt).not.toBeNull();
  });

  it('se o Drive falhar, o projeto continua no ERP e nada muda', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    drive.failOn = { op: 'trashFolder' };
    const res = await inject('DELETE', `/projects/${project.id}`, admin.headers);
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('drive_failed');
    const [p] = await db.select().from(schema.projects);
    expect(p.deletedAt).toBeNull();
    expect(drive.folders.get(project.driveFolderId)!.trashed).toBe(false);
  });

  it('pasta já apagada por fora do ERP não impede a exclusão', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    drive.folders.delete(project.driveFolderId);
    expect((await inject('DELETE', `/projects/${project.id}`, admin.headers)).statusCode).toBe(204);
  });

  it('aprovar pedido de exclusão de projeto faz o mesmo', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'project', itemId: project.id })).json();
    drive.resetCalls();
    expect((await inject('POST', `/deletion-requests/${req.id}/approve`, admin.headers)).statusCode).toBe(200);
    expect(drive.calls).toEqual(['trashFolder']);
    expect(drive.folders.get(project.driveFolderId)!.trashed).toBe(true);
    const [audit] = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, 'project.delete'));
    expect(audit.payload).toMatchObject({ trashedInDrive: true, requestId: req.id });
  });

  it('aprovar com o Drive fora do ar: 502 e o pedido continua pendente', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'project', itemId: project.id })).json();
    drive.failOn = { op: 'trashFolder' };
    expect((await inject('POST', `/deletion-requests/${req.id}/approve`, admin.headers)).statusCode).toBe(502);
    const [r] = await db.select().from(schema.deletionRequests);
    expect(r.status).toBe('pending');
    const [p] = await db.select().from(schema.projects);
    expect(p.deletedAt).toBeNull();
  });
});

describe('Compartilhamento automático com o Drive (aceite)', () => {
  async function invite(headers: Headers, email = 'bia@decroqui.test', role = 'member') {
    return inject('POST', '/users', headers, { email, name: 'Bia Lopes', role });
  }

  it('convidar compartilha "De.Croqui ERP" como leitor e guarda o ID da permissão', async () => {
    const admin = await as('admin');
    const res = await invite(admin.headers, 'bia@decroqui.test', 'admin');
    expect(res.statusCode).toBe(201);
    expect(res.json().driveAccess).toBe('reader');
    const perms = drive.permissionsOf('bia@decroqui.test');
    expect(perms).toHaveLength(1);
    // Sempre leitor, mesmo convidando como administrador.
    expect(perms[0]).toMatchObject({ folderId: rootFolderId(), role: 'reader' });
    const [u] = await db.select().from(schema.users).where(eq(schema.users.email, 'bia@decroqui.test'));
    expect(u.drivePermissionId).toBe(perms[0].id);
    const actions = (await db.select().from(schema.auditLog)).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['user.invite', 'drive.share']));
  });

  it('convite antes do primeiro projeto cria a pasta raiz para compartilhar', async () => {
    const admin = await as('admin');
    expect(rootFolderId()).toBeUndefined();
    await invite(admin.headers);
    expect(rootFolderId()).toBeDefined();
    expect(drive.permissionsOf('bia@decroqui.test')[0].folderId).toBe(rootFolderId());
  });

  it('alterar o papel não mexe na permissão do Drive', async () => {
    const admin = await as('admin');
    const bia = (await invite(admin.headers)).json();
    drive.resetCalls();
    for (const role of ['viewer', 'admin', 'member']) {
      const res = await inject('PATCH', `/users/${bia.id}/role`, admin.headers, { role });
      expect(res.statusCode).toBe(200);
      expect(res.json().driveAccess).toBe('reader');
    }
    expect(drive.calls).toEqual([]);
    expect(drive.permissionsOf('bia@decroqui.test')).toHaveLength(1);
  });

  it('desativar revoga só a permissão do colaborador', async () => {
    const admin = await as('admin');
    const bia = (await invite(admin.headers)).json();
    await invite(admin.headers, 'caio@decroqui.test');
    const res = await inject('POST', `/users/${bia.id}/disable`, admin.headers);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'disabled', driveAccess: 'none' });
    expect(drive.permissionsOf('bia@decroqui.test')).toEqual([]);
    expect(drive.permissionsOf('caio@decroqui.test')).toHaveLength(1);
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, bia.id));
    expect(u.drivePermissionId).toBeNull();
  });

  it('remover um convidado revoga a permissão antes de apagar o registro', async () => {
    const admin = await as('admin');
    const bia = (await invite(admin.headers)).json();
    expect((await inject('DELETE', `/users/${bia.id}`, admin.headers)).statusCode).toBe(204);
    expect(drive.permissionsOf('bia@decroqui.test')).toEqual([]);
    expect(await db.select().from(schema.users).where(eq(schema.users.id, bia.id))).toEqual([]);
  });

  it('remover com o Drive fora do ar: 502 e nada é removido', async () => {
    const admin = await as('admin');
    const bia = (await invite(admin.headers)).json();
    drive.failOn = { op: 'revokePermission' };
    const res = await inject('DELETE', `/users/${bia.id}`, admin.headers);
    expect(res.statusCode).toBe(502);
    expect(await db.select().from(schema.users).where(eq(schema.users.id, bia.id))).toHaveLength(1);
    expect(drive.permissionsOf('bia@decroqui.test')).toHaveLength(1);
  });

  it('falha ao compartilhar não perde o convite; a administração é avisada e tenta de novo', async () => {
    const admin = await as('admin');
    const other = await as('admin', 'outra-admin@decroqui.test');
    const member = await as('member');
    drive.failOn = { op: 'shareReader' };
    const res = await invite(admin.headers);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ status: 'invited', driveAccess: 'missing' });
    const [u] = await db.select().from(schema.users).where(eq(schema.users.email, 'bia@decroqui.test'));
    expect(u.status).toBe('invited');
    expect(u.drivePermissionId).toBeNull();

    // Aviso para todos os administradores ativos, inclusive quem convidou; colaborador não recebe.
    for (const id of [admin.user.id, other.user.id]) {
      const [n] = await notificationsOf(id);
      expect(n).toMatchObject({ type: 'drive.failed', link: '/colaboradores' });
      expect(n.body).toContain('bia@decroqui.test');
    }
    expect(await notificationsOf(member.user.id)).toEqual([]);

    // Na lista aparece o aviso; tentar de novo compartilha.
    const listed = (await inject('GET', '/users', admin.headers)).json().find((c: { id: string }) => c.id === u.id);
    expect(listed.driveAccess).toBe('missing');
    drive.failOn = null;
    const retry = await inject('POST', `/users/${u.id}/drive-access`, admin.headers);
    expect(retry.statusCode).toBe(200);
    expect(retry.json().driveAccess).toBe('reader');
    expect(drive.permissionsOf('bia@decroqui.test')).toHaveLength(1);
  });

  it('falha ao revogar: a conta fica desativada, o aviso chega e tentar de novo revoga', async () => {
    const admin = await as('admin');
    const bia = (await invite(admin.headers)).json();
    drive.failOn = { op: 'revokePermission' };
    const res = await inject('POST', `/users/${bia.id}/disable`, admin.headers);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'disabled', driveAccess: 'revoke_pending' });
    const [n] = await notificationsOf(admin.user.id);
    expect(n).toMatchObject({ type: 'drive.failed', title: 'Revogação no Drive falhou' });
    drive.failOn = null;
    const retry = await inject('POST', `/users/${bia.id}/drive-access`, admin.headers);
    expect(retry.json().driveAccess).toBe('none');
    expect(drive.permissionsOf('bia@decroqui.test')).toEqual([]);
  });

  it('tentar de novo com o Drive ainda fora: 502, sem aviso repetido', async () => {
    const admin = await as('admin');
    drive.failOn = { op: 'shareReader' };
    const bia = (await invite(admin.headers)).json();
    expect((await inject('POST', `/users/${bia.id}/drive-access`, admin.headers)).statusCode).toBe(502);
    expect(await notificationsOf(admin.user.id)).toHaveLength(1);
  });

  it('a conta dona dos arquivos não recebe permissão', async () => {
    const admin = await as('admin');
    const list = (await inject('GET', '/users', admin.headers)).json();
    expect(list.find((c: { email: string }) => c.email === ADMIN_EMAIL).driveAccess).toBe('owner');
    drive.resetCalls();
    await inject('POST', `/users/${admin.user.id}/drive-access`, admin.headers);
    expect(drive.calls).toEqual([]);
  });

  it('colaborador e somente leitura não tentam de novo (403, Drive intocado)', async () => {
    const admin = await as('admin');
    drive.failOn = { op: 'shareReader' };
    const bia = (await invite(admin.headers)).json();
    drive.failOn = null;
    for (const role of ['member', 'viewer'] as const) {
      const { headers } = await as(role);
      drive.resetCalls();
      expect((await inject('POST', `/users/${bia.id}/drive-access`, headers)).statusCode).toBe(403);
      expect(drive.calls).toEqual([]);
    }
  });
});

describe('Notificações por evento (aceite)', () => {
  async function setup() {
    const admin = await as('admin');
    const other = await as('admin', 'outra-admin@decroqui.test');
    const member = await as('member');
    const viewer = await as('viewer');
    const project = await newProject(member.headers);
    const { done } = await upload(member.headers, project.id, { name: 'planta.pdf', mimeType: 'application/pdf', size: 1000, subfolder: 'contracts' });
    return { admin, other, member, viewer, project, file: done.json() };
  }

  it('novo pedido: avisa os administradores ativos, não quem pediu', async () => {
    const { admin, other, member, viewer, project, file } = await setup();
    await db.insert(schema.users).values({ email: 'adm-off@decroqui.test', name: 'Desativada', role: 'admin', status: 'disabled' });
    await inject('POST', '/deletion-requests', member.headers, { itemType: 'file', itemId: file.id, reason: 'Versão antiga' });
    for (const id of [admin.user.id, other.user.id]) {
      const list = await notificationsOf(id);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({
        type: 'deletion.requested',
        title: 'Novo pedido de exclusão',
        body: `Pessoa member pediu a exclusão de planta.pdf em Casa Alecrim.`,
        link: '/pedidos-de-exclusao',
        readAt: null,
      });
    }
    expect(await notificationsOf(member.user.id)).toEqual([]);
    expect(await notificationsOf(viewer.user.id)).toEqual([]);
    const [off] = await db.select().from(schema.users).where(eq(schema.users.email, 'adm-off@decroqui.test'));
    expect(await notificationsOf(off.id)).toEqual([]);
    expect(project.id).toBeDefined();
  });

  it('pedido de projeto: "pediu a exclusão do projeto"', async () => {
    const { admin, member, project } = await setup();
    await inject('POST', '/deletion-requests', member.headers, { itemType: 'project', itemId: project.id });
    const [n] = await notificationsOf(admin.user.id);
    expect(n.body).toBe('Pessoa member pediu a exclusão do projeto Casa Alecrim.');
  });

  it('pedido feito por um administrador avisa só os outros', async () => {
    const { admin, other, file } = await setup();
    await inject('POST', '/deletion-requests', other.headers, { itemType: 'file', itemId: file.id });
    expect(await notificationsOf(other.user.id)).toEqual([]);
    expect(await notificationsOf(admin.user.id)).toHaveLength(1);
  });

  it('aprovado: avisa quem pediu, com link para o projeto', async () => {
    const { admin, member, project, file } = await setup();
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'file', itemId: file.id })).json();
    await inject('POST', `/deletion-requests/${req.id}/approve`, admin.headers);
    const [n] = await notificationsOf(member.user.id);
    expect(n).toMatchObject({
      type: 'deletion.approved',
      title: 'Pedido de exclusão aprovado',
      body: 'planta.pdf em Casa Alecrim foi para a lixeira do Google Drive.',
      link: `/projetos/${project.id}`,
    });
  });

  it('recusado: avisa quem pediu', async () => {
    const { admin, member, project } = await setup();
    const note = (await inject('POST', `/projects/${project.id}/notes`, member.headers, { body: 'Cliente pediu mármore' })).json();
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'note', itemId: note.id })).json();
    await inject('POST', `/deletion-requests/${req.id}/reject`, admin.headers);
    const [n] = await notificationsOf(member.user.id);
    expect(n).toMatchObject({ type: 'deletion.rejected', title: 'Pedido de exclusão recusado', body: 'A nota continua em Casa Alecrim.', link: `/projetos/${project.id}` });
  });

  it('projeto aprovado: o link vai para a lista, porque o projeto saiu', async () => {
    const { admin, member, project } = await setup();
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'project', itemId: project.id })).json();
    await inject('POST', `/deletion-requests/${req.id}/approve`, admin.headers);
    const [n] = await notificationsOf(member.user.id);
    expect(n).toMatchObject({ type: 'deletion.approved', link: '/projetos', body: 'O projeto Casa Alecrim foi excluído, e a pasta foi para a lixeira do Google Drive.' });
  });

  it('exclusão direta que fecha um pedido também avisa quem pediu', async () => {
    const { admin, member, file } = await setup();
    await inject('POST', '/deletion-requests', member.headers, { itemType: 'file', itemId: file.id });
    await inject('DELETE', `/files/${file.id}`, admin.headers);
    const [n] = await notificationsOf(member.user.id);
    expect(n.type).toBe('deletion.approved');
  });

  it('aprovação que falhou no Drive não avisa ninguém', async () => {
    const { admin, member, file } = await setup();
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'file', itemId: file.id })).json();
    drive.failOn = { op: 'trashFile' };
    expect((await inject('POST', `/deletion-requests/${req.id}/approve`, admin.headers)).statusCode).toBe(502);
    expect(await notificationsOf(member.user.id)).toEqual([]);
  });
});

describe('Notificações: cada pessoa lê só as próprias (aceite)', () => {
  async function seed() {
    const admin = await as('admin');
    const member = await as('member');
    const viewer = await as('viewer');
    const project = await newProject(member.headers);
    const note = (await inject('POST', `/projects/${project.id}/notes`, member.headers, { body: 'x' })).json();
    const req = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'note', itemId: note.id })).json();
    await inject('POST', `/deletion-requests/${req.id}/reject`, admin.headers);
    const [adminNote] = await notificationsOf(admin.user.id);
    const [memberNote] = await notificationsOf(member.user.id);
    return { admin, member, viewer, adminNote, memberNote };
  }

  it('a lista traz só as notificações de quem está conectado, com o total de não lidas', async () => {
    const { admin, member, viewer, adminNote, memberNote } = await seed();
    const a = (await inject('GET', '/notifications', admin.headers)).json();
    expect(a.items.map((n: { id: string }) => n.id)).toEqual([adminNote.id]);
    expect(a.unread).toBe(1);
    const m = (await inject('GET', '/notifications', member.headers)).json();
    expect(m.items.map((n: { id: string }) => n.id)).toEqual([memberNote.id]);
    const v = (await inject('GET', '/notifications', viewer.headers)).json();
    expect(v).toMatchObject({ items: [], unread: 0, pendingDeletionRequests: null });
  });

  it('marcar como lida a de outra pessoa: 404, e ela continua não lida', async () => {
    const { member, viewer, adminNote } = await seed();
    for (const who of [member, viewer]) {
      expect((await inject('POST', `/notifications/${adminNote.id}/read`, who.headers)).statusCode).toBe(404);
    }
    const [n] = await db.select().from(schema.notifications).where(eq(schema.notifications.id, adminNote.id));
    expect(n.readAt).toBeNull();
  });

  it('marcar uma como lida ao abrir', async () => {
    const { member, memberNote } = await seed();
    expect((await inject('POST', `/notifications/${memberNote.id}/read`, member.headers)).statusCode).toBe(204);
    const m = (await inject('GET', '/notifications', member.headers)).json();
    expect(m.unread).toBe(0);
    expect(m.items[0].readAt).not.toBeNull();
  });

  it('marcar todas só marca as próprias', async () => {
    const { admin, member, adminNote } = await seed();
    expect((await inject('POST', '/notifications/read-all', member.headers)).statusCode).toBe(204);
    expect((await inject('GET', '/notifications', member.headers)).json().unread).toBe(0);
    const [n] = await db.select().from(schema.notifications).where(eq(schema.notifications.id, adminNote.id));
    expect(n.readAt).toBeNull();
    expect((await inject('GET', '/notifications', admin.headers)).json().unread).toBe(1);
  });

  it('sem sessão: 401 em todas as rotas', async () => {
    const { memberNote } = await seed();
    expect((await app.inject({ method: 'GET', url: '/notifications' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: `/notifications/${memberNote.id}/read` })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/notifications/read-all' })).statusCode).toBe(401);
  });

  it('remover a conta apaga as notificações dela', async () => {
    const admin = await as('admin');
    drive.failOn = { op: 'shareReader' };
    const bia = (await inject('POST', '/users', admin.headers, { email: 'bia@decroqui.test', name: 'Bia', role: 'admin' })).json();
    drive.failOn = null;
    await db.update(schema.users).set({ status: 'active' }).where(eq(schema.users.id, bia.id));
    await db.insert(schema.notifications).values({ userId: bia.id, type: 'drive.failed', title: 't', body: 'b', link: null });
    await inject('POST', `/users/${bia.id}/disable`, admin.headers);
    await inject('DELETE', `/users/${bia.id}`, admin.headers);
    expect(await notificationsOf(bia.id)).toEqual([]);
  });
});

describe('Contador de pedidos pendentes no menu do avatar (aceite)', () => {
  it('administrador vê o total; some (zero) quando não há pendentes; colaborador não recebe', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const n1 = (await inject('POST', `/projects/${project.id}/notes`, member.headers, { body: 'a' })).json();
    const n2 = (await inject('POST', `/projects/${project.id}/notes`, member.headers, { body: 'b' })).json();
    const count = async () => (await inject('GET', '/notifications', admin.headers)).json().pendingDeletionRequests;
    expect(await count()).toBe(0);
    const r1 = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'note', itemId: n1.id })).json();
    const r2 = (await inject('POST', '/deletion-requests', member.headers, { itemType: 'note', itemId: n2.id })).json();
    expect(await count()).toBe(2);
    expect((await inject('GET', '/notifications', member.headers)).json().pendingDeletionRequests).toBeNull();
    await inject('POST', `/deletion-requests/${r1.id}/approve`, admin.headers);
    expect(await count()).toBe(1);
    await inject('POST', `/deletion-requests/${r2.id}/reject`, admin.headers);
    expect(await count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------

/** Linhas novas da matriz (Fase 3c), cada uma com a rota real, testadas em cada papel. */
type Ctx = { fileId: string; userId: string; notificationId: string; headers: Headers };
const LINES: { row: string; route: string; expected: Record<Role, boolean>; ok: number; call: (c: Ctx) => Promise<{ statusCode: number }> }[] = [
  { row: 'Ver imagem grande pelo ERP', route: 'GET /files/:id/image', expected: { admin: true, member: true, viewer: true }, ok: 200, call: (c) => inject('GET', `/files/${c.fileId}/image`, c.headers) },
  { row: 'Tentar de novo o acesso ao Drive', route: 'POST /users/:id/drive-access', expected: { admin: true, member: false, viewer: false }, ok: 200, call: (c) => inject('POST', `/users/${c.userId}/drive-access`, c.headers) },
  { row: 'Ver as próprias notificações', route: 'GET /notifications', expected: { admin: true, member: true, viewer: true }, ok: 200, call: (c) => inject('GET', '/notifications', c.headers) },
  { row: 'Marcar a própria notificação como lida', route: 'POST /notifications/:id/read', expected: { admin: true, member: true, viewer: true }, ok: 204, call: (c) => inject('POST', `/notifications/${c.notificationId}/read`, c.headers) },
  { row: 'Marcar todas como lidas', route: 'POST /notifications/read-all', expected: { admin: true, member: true, viewer: true }, ok: 204, call: (c) => inject('POST', '/notifications/read-all', c.headers) },
];

describe('Matriz de permissões da Fase 3c, cada linha em cada papel', () => {
  for (const line of LINES) {
    for (const role of ROLES) {
      const allowed = line.expected[role];
      it(`${line.row} (${line.route}) · ${role}: ${allowed ? 'permitido' : '403'}`, async () => {
        const admin = await as('admin');
        const project = await newProject(admin.headers);
        const { done } = await upload(admin.headers, project.id, { name: 'sala.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' });
        drive.failOn = { op: 'shareReader' };
        const bia = (await inject('POST', '/users', admin.headers, { email: 'bia@decroqui.test', name: 'Bia', role: 'member' })).json();
        drive.failOn = null;
        const me = await as(role);
        const [n] = await db.insert(schema.notifications).values({ userId: me.user.id, type: 'drive.failed', title: 't', body: 'b', link: null }).returning();
        const res = await line.call({ fileId: done.json().id, userId: bia.id, notificationId: n.id, headers: me.headers });
        expect(res.statusCode).toBe(allowed ? line.ok : 403);
      });
    }
  }
});
