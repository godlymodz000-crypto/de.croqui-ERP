// Testes da Fase 3b: arquivos, notas, PDFs exportados e pedidos de exclusão.
// Banco em memória (PGlite) e Drive falso; o Drive real é testado à mão com a conta do administrador.
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

async function as(role: Role) {
  let user;
  if (role === 'admin') {
    [user] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  } else {
    [user] = await db
      .insert(schema.users)
      .values({ email: `${role}-${randomToken(4)}@decroqui.test`, name: `Pessoa ${role}`, role, status: 'active' })
      .returning();
  }
  const { token } = await createSession(db, user.id);
  return { user, headers: { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` } as Headers };
}

async function newProject(headers: Headers, name = 'Casa Alecrim') {
  const res = await app.inject({ method: 'POST', url: '/projects', headers, payload: { name, clientName: 'Helena Prado' } });
  return res.json() as { id: string; driveFolderId: string };
}

function subfolderOf(projectFolderId: string, name: string) {
  return drive.childrenOf(projectFolderId).find((f) => f.name === name)!;
}

/** Abre a sessão, simula o navegador enviando para o Drive e confirma. */
async function upload(headers: Headers, projectId: string, file = { name: 'planta-baixa.pdf', mimeType: 'application/pdf', size: 6 * MB, subfolder: 'contracts' }) {
  const session = await app.inject({ method: 'POST', url: `/projects/${projectId}/uploads`, headers, payload: file });
  const { uploadUrl, token } = session.json();
  const driveFileId = drive.browserUpload(uploadUrl);
  const done = await app.inject({ method: 'POST', url: `/projects/${projectId}/uploads/complete`, headers, payload: { token, driveFileId } });
  return { session, done, driveFileId, token, uploadUrl };
}

async function rows() {
  return {
    files: await db.select().from(schema.projectFiles),
    notes: await db.select().from(schema.projectNotes),
    requests: await db.select().from(schema.deletionRequests),
    projects: await db.select().from(schema.projects),
  };
}

// ---------------------------------------------------------------------------------------------

/**
 * Linhas da matriz desta fase, cada uma com a rota real. Para cada papel recusado, o teste também
 * confere que o Drive não foi chamado e que nada mudou no banco.
 */
type Ctx = { projectId: string; fileId: string; noteId: string; requestId: string; headers: Headers };
const LINES: { row: string; route: string; expected: Record<Role, boolean>; call: (c: Ctx) => Promise<{ status: number }>; ok: number }[] = [
  { row: 'Ver arquivos', route: 'GET /projects/:id/files', expected: { admin: true, member: true, viewer: true }, ok: 200, call: (c) => inject('GET', `/projects/${c.projectId}/files`, c.headers) },
  { row: 'Ver miniatura', route: 'GET /files/:id/thumbnail', expected: { admin: true, member: true, viewer: true }, ok: 200, call: (c) => inject('GET', `/files/${c.fileId}/thumbnail`, c.headers) },
  { row: 'Ver notas', route: 'GET /projects/:id/notes', expected: { admin: true, member: true, viewer: true }, ok: 200, call: (c) => inject('GET', `/projects/${c.projectId}/notes`, c.headers) },
  {
    row: 'Enviar arquivo (abrir sessão)',
    route: 'POST /projects/:id/uploads',
    expected: { admin: true, member: true, viewer: false },
    ok: 201,
    call: (c) => inject('POST', `/projects/${c.projectId}/uploads`, c.headers, { name: 'foto.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' }),
  },
  {
    row: 'Enviar arquivo (confirmar)',
    route: 'POST /projects/:id/uploads/complete',
    expected: { admin: true, member: true, viewer: false },
    ok: 201,
    call: async (c) => {
      const s = await app.inject({ method: 'POST', url: `/projects/${c.projectId}/uploads`, headers: c.headers, payload: { name: 'foto.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' } });
      if (s.statusCode !== 201) return inject('POST', `/projects/${c.projectId}/uploads/complete`, c.headers, { token: 'x', driveFileId: 'arquivo-inexistente' });
      drive.resetCalls();
      const id = drive.browserUpload(s.json().uploadUrl);
      return inject('POST', `/projects/${c.projectId}/uploads/complete`, c.headers, { token: s.json().token, driveFileId: id });
    },
  },
  {
    row: 'Salvar PDF exportado (abrir sessão)',
    route: 'POST /projects/:id/exports',
    expected: { admin: true, member: true, viewer: false },
    ok: 201,
    call: (c) => inject('POST', `/projects/${c.projectId}/exports`, c.headers, { kind: 'budget', size: 2000 }),
  },
  {
    row: 'Salvar PDF exportado (confirmar)',
    route: 'POST /projects/:id/exports/complete',
    expected: { admin: true, member: true, viewer: false },
    ok: 201,
    call: async (c) => {
      const s = await app.inject({ method: 'POST', url: `/projects/${c.projectId}/exports`, headers: c.headers, payload: { kind: 'presentation', size: 2000 } });
      if (s.statusCode !== 201) return inject('POST', `/projects/${c.projectId}/exports/complete`, c.headers, { token: 'x', driveFileId: 'arquivo-inexistente' });
      const id = drive.browserUpload(s.json().uploadUrl);
      return inject('POST', `/projects/${c.projectId}/exports/complete`, c.headers, { token: s.json().token, driveFileId: id });
    },
  },
  { row: 'Criar nota', route: 'POST /projects/:id/notes', expected: { admin: true, member: true, viewer: false }, ok: 201, call: (c) => inject('POST', `/projects/${c.projectId}/notes`, c.headers, { body: 'Texto' }) },
  { row: 'Pedir exclusão', route: 'POST /deletion-requests', expected: { admin: true, member: true, viewer: false }, ok: 201, call: (c) => inject('POST', '/deletion-requests', c.headers, { itemType: 'note', itemId: c.noteId }) },
  { row: 'Excluir arquivo diretamente', route: 'DELETE /files/:id', expected: { admin: true, member: false, viewer: false }, ok: 204, call: (c) => inject('DELETE', `/files/${c.fileId}`, c.headers) },
  { row: 'Excluir nota diretamente', route: 'DELETE /notes/:id', expected: { admin: true, member: false, viewer: false }, ok: 204, call: (c) => inject('DELETE', `/notes/${c.noteId}`, c.headers) },
  { row: 'Excluir projeto diretamente', route: 'DELETE /projects/:id', expected: { admin: true, member: false, viewer: false }, ok: 204, call: (c) => inject('DELETE', `/projects/${c.projectId}`, c.headers) },
  { row: 'Ver pedidos de exclusão', route: 'GET /deletion-requests', expected: { admin: true, member: false, viewer: false }, ok: 200, call: (c) => inject('GET', '/deletion-requests', c.headers) },
  { row: 'Aprovar pedido', route: 'POST /deletion-requests/:id/approve', expected: { admin: true, member: false, viewer: false }, ok: 200, call: (c) => inject('POST', `/deletion-requests/${c.requestId}/approve`, c.headers) },
  { row: 'Recusar pedido', route: 'POST /deletion-requests/:id/reject', expected: { admin: true, member: false, viewer: false }, ok: 200, call: (c) => inject('POST', `/deletion-requests/${c.requestId}/reject`, c.headers) },
];

async function inject(method: 'GET' | 'POST' | 'DELETE', url: string, headers: Headers, payload?: object) {
  const res = await app.inject({ method, url, headers, payload });
  return { status: res.statusCode };
}

/** Projeto com uma foto, uma nota e um pedido pendente (de outra pessoa) sobre a foto. */
async function seed() {
  const admin = await as('admin');
  const project = await newProject(admin.headers);
  const photo = await upload(admin.headers, project.id, { name: 'fachada.jpg', mimeType: 'image/jpeg', size: 3 * MB, subfolder: 'photos' });
  const note = await app.inject({ method: 'POST', url: `/projects/${project.id}/notes`, headers: admin.headers, payload: { body: 'Primeira reunião feita.' } });
  const requester = await as('member');
  const req = await app.inject({ method: 'POST', url: '/deletion-requests', headers: requester.headers, payload: { itemType: 'file', itemId: photo.done.json().id } });
  return { projectId: project.id, fileId: photo.done.json().id as string, noteId: note.json().id as string, requestId: req.json().id as string };
}

describe('Permissões da Fase 3b (seção 5), cada linha em cada papel', () => {
  for (const line of LINES) {
    for (const role of ROLES) {
      const allowed = line.expected[role];
      it(`${line.row} — ${role}: ${allowed ? 'permitido' : '403'}`, async () => {
        const ids = await seed();
        const { headers } = await as(role);
        const before = await rows();
        drive.resetCalls();
        const res = await line.call({ ...ids, headers });
        expect(res.status).toBe(allowed ? line.ok : 403);
        if (!allowed) {
          expect(drive.calls).toEqual([]);
          expect(await rows()).toEqual(before);
        }
      });
    }
  }
});

describe('Upload direto no Drive (aceite)', () => {
  it('arquivo acima de 5 MB vai para a subpasta escolhida e aparece na lista', async () => {
    const { user, headers } = await as('member');
    const project = await newProject(headers);
    const { session, done, driveFileId } = await upload(headers, project.id);
    expect(session.statusCode).toBe(201);
    // A sessão é aberta na subpasta Contratos, liberada para o endereço do ERP.
    const s = drive.sessions.get(session.json().uploadUrl)!;
    expect(s.parentId).toBe(subfolderOf(project.driveFolderId, 'Contratos').id);
    expect(s.origin).toBe('http://localhost:5173');
    expect(s.size).toBe(6 * MB);
    expect(done.statusCode).toBe(201);
    expect(done.json()).toMatchObject({ name: 'planta-baixa.pdf', sizeBytes: 6 * MB, subfolder: 'contracts', source: 'upload', driveFileId, uploadedBy: user.name });
    expect(done.json().driveUrl).toBe(`https://drive.google.com/file/d/${driveFileId}/view`);
    const list = (await app.inject({ method: 'GET', url: `/projects/${project.id}/files`, headers })).json();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('planta-baixa.pdf');
  });

  it('fotos vão para Fotos', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const { session } = await upload(headers, project.id, { name: 'sala.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' });
    expect(drive.sessions.get(session.json().uploadUrl)!.parentId).toBe(subfolderOf(project.driveFolderId, 'Fotos').id);
  });

  it('não aceita enviar para a raiz do projeto nem para Orçamentos ou Apresentações', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    drive.resetCalls();
    for (const subfolder of [undefined, 'root', 'budgets', 'presentations']) {
      const res = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads`, headers, payload: { name: 'a.pdf', size: 10, subfolder } });
      expect(res.statusCode).toBe(400);
      expect(res.json().fields.subfolder).toBe('invalid');
    }
    expect(drive.calls).toEqual([]);
  });

  it('se a subpasta foi apagada no Drive, ela é criada de novo', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    subfolderOf(project.driveFolderId, 'Fotos').trashed = true;
    const { done } = await upload(headers, project.id, { name: 'sala.jpg', mimeType: 'image/jpeg', size: 1000, subfolder: 'photos' });
    expect(done.statusCode).toBe(201);
    expect(subfolderOf(project.driveFolderId, 'Fotos')).toBeDefined();
  });

  it('grava no audit_log quem enviou e o ID do arquivo no Drive', async () => {
    const { user, headers } = await as('member');
    const project = await newProject(headers);
    const { done, driveFileId } = await upload(headers, project.id);
    const [entry] = await db.select().from(schema.auditLog).where(eq(schema.auditLog.entityId, done.json().id));
    expect(entry).toMatchObject({ userId: user.id, action: 'file.upload', entity: 'file' });
    expect(entry.payload).toMatchObject({ driveFileId, subfolder: 'contracts', sizeBytes: 6 * MB });
  });
});

describe('Falha no upload não deixa registro órfão (aceite)', () => {
  it('Drive fora do ar ao abrir a sessão: 502 e nada gravado', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    drive.failOn = { op: 'createUploadSession' };
    const res = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads`, headers, payload: { name: 'a.pdf', size: 10, subfolder: 'contracts' } });
    expect(res.statusCode).toBe(502);
    expect((await rows()).files).toEqual([]);
  });

  it('envio interrompido (nunca confirmado): nada no banco', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const res = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads`, headers, payload: { name: 'a.pdf', size: 10, subfolder: 'contracts' } });
    expect(res.statusCode).toBe(201);
    expect((await rows()).files).toEqual([]);
    expect(await db.select().from(schema.auditLog).where(eq(schema.auditLog.entity, 'file'))).toEqual([]);
  });

  it('arquivo que chegou incompleto no Drive: 409, vai para a lixeira e nada é gravado', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const s = (await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads`, headers, payload: { name: 'a.pdf', size: 6 * MB, subfolder: 'contracts' } })).json();
    const id = drive.browserUpload(s.uploadUrl, { size: 2 * MB });
    const res = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads/complete`, headers, payload: { token: s.token, driveFileId: id } });
    expect(res.statusCode).toBe(409);
    expect(drive.folders.get(id)!.trashed).toBe(true);
    expect((await rows()).files).toEqual([]);
  });

  it('autorização adulterada, de outra pessoa ou de outro projeto: 400', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const p1 = await newProject(admin.headers);
    const p2 = await newProject(admin.headers, 'Casa Figueira');
    const s = (await app.inject({ method: 'POST', url: `/projects/${p1.id}/uploads`, headers: admin.headers, payload: { name: 'a.pdf', size: 10, subfolder: 'contracts' } })).json();
    const id = drive.browserUpload(s.uploadUrl);
    const [payload, sig] = s.token.split('.');
    const forged = `${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), size: 99 })).toString('base64url')}.${sig}`;
    for (const [headers, url, token] of [
      [admin.headers, `/projects/${p1.id}/uploads/complete`, forged],
      [member.headers, `/projects/${p1.id}/uploads/complete`, s.token],
      [admin.headers, `/projects/${p2.id}/uploads/complete`, s.token],
      [admin.headers, `/projects/${p1.id}/exports/complete`, s.token],
    ] as const) {
      expect((await app.inject({ method: 'POST', url, headers, payload: { token, driveFileId: id } })).statusCode).toBe(400);
    }
    expect((await rows()).files).toEqual([]);
  });

  it('ID de arquivo fora da pasta autorizada: 409 e o arquivo não é tocado', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const s = (await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads`, headers, payload: { name: 'a.pdf', size: 10, subfolder: 'contracts' } })).json();
    const other = drive.browserUpload(s.uploadUrl, { parentId: 'pasta-de-outra-pessoa' });
    const res = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads/complete`, headers, payload: { token: s.token, driveFileId: other } });
    expect(res.statusCode).toBe(409);
    expect(drive.folders.get(other)!.trashed).toBe(false);
    expect((await rows()).files).toEqual([]);
  });

  it('confirmar duas vezes não duplica', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const { token, driveFileId } = await upload(headers, project.id);
    const again = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads/complete`, headers, payload: { token, driveFileId } });
    expect(again.statusCode).toBe(409);
    expect((await rows()).files).toHaveLength(1);
  });
});

describe('Exportar PDF salva na pasta certa do Drive (aceite)', () => {
  it('orçamento vai para Orçamentos com o nome e a data da exportação', async () => {
    const { headers } = await as('member');
    const project = await newProject(headers);
    const s = await app.inject({ method: 'POST', url: `/projects/${project.id}/exports`, headers, payload: { kind: 'budget', size: 412_000 } });
    expect(s.statusCode).toBe(201);
    expect(s.json().name).toMatch(/^Orçamento - Casa Alecrim - \d{2}-\d{2}-\d{4}\.pdf$/);
    const session = drive.sessions.get(s.json().uploadUrl)!;
    expect(session.parentId).toBe(subfolderOf(project.driveFolderId, 'Orçamentos').id);
    expect(session.mimeType).toBe('application/pdf');
    const id = drive.browserUpload(s.json().uploadUrl);
    const done = await app.inject({ method: 'POST', url: `/projects/${project.id}/exports/complete`, headers, payload: { token: s.json().token, driveFileId: id } });
    expect(done.json()).toMatchObject({ subfolder: 'budgets', source: 'pdf_export' });
    const list = (await app.inject({ method: 'GET', url: `/projects/${project.id}/files`, headers })).json();
    expect(list.map((f: { name: string }) => f.name)).toEqual([s.json().name]);
  });

  it('apresentação vai para Apresentações', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const s = (await app.inject({ method: 'POST', url: `/projects/${project.id}/exports`, headers, payload: { kind: 'presentation', size: 9 * MB } })).json();
    expect(s.name).toMatch(/^Apresentação - Casa Alecrim - /);
    expect(drive.sessions.get(s.uploadUrl)!.parentId).toBe(subfolderOf(project.driveFolderId, 'Apresentações').id);
  });

  it('o confirmar de upload não aceita autorização de exportação', async () => {
    const { headers } = await as('admin');
    const project = await newProject(headers);
    const s = (await app.inject({ method: 'POST', url: `/projects/${project.id}/exports`, headers, payload: { kind: 'budget', size: 10 } })).json();
    const id = drive.browserUpload(s.uploadUrl);
    const res = await app.inject({ method: 'POST', url: `/projects/${project.id}/uploads/complete`, headers, payload: { token: s.token, driveFileId: id } });
    expect(res.statusCode).toBe(400);
  });
});

describe('Notas (aceite: criadas e listadas por projeto)', () => {
  it('cada projeto lista só as suas notas, da mais nova para a mais antiga, com autor', async () => {
    const { user, headers } = await as('member');
    const a = await newProject(headers);
    const b = await newProject(headers, 'Casa Figueira');
    await app.inject({ method: 'POST', url: `/projects/${a.id}/notes`, headers, payload: { body: 'Primeira' } });
    await app.inject({ method: 'POST', url: `/projects/${b.id}/notes`, headers, payload: { body: 'De outro projeto' } });
    await app.inject({ method: 'POST', url: `/projects/${a.id}/notes`, headers, payload: { body: '  Segunda  ' } });
    const list = (await app.inject({ method: 'GET', url: `/projects/${a.id}/notes`, headers })).json();
    expect(list.map((n: { body: string }) => n.body)).toEqual(['Segunda', 'Primeira']);
    expect(list[0].author).toBe(user.name);
    const entries = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, 'note.create'));
    expect(entries).toHaveLength(3);
  });

  it('nota vazia é recusada', async () => {
    const { headers } = await as('admin');
    const p = await newProject(headers);
    const res = await app.inject({ method: 'POST', url: `/projects/${p.id}/notes`, headers, payload: { body: '   ' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('Pedidos de exclusão (aceite)', () => {
  it('colaborador pede, administrador aprova, o arquivo vai para a lixeira do Drive', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const { done, driveFileId } = await upload(member.headers, project.id);
    const fileId = done.json().id;

    const req = await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'file', itemId: fileId, reason: 'Versão errada' } });
    expect(req.statusCode).toBe(201);
    const listed = (await app.inject({ method: 'GET', url: `/projects/${project.id}/files`, headers: member.headers })).json();
    expect(listed[0].pendingDeletion).toBe(true);

    const pending = (await app.inject({ method: 'GET', url: '/deletion-requests', headers: admin.headers })).json();
    expect(pending.counts).toEqual({ pending: 1, approved: 0, rejected: 0 });
    expect(pending.requests[0]).toMatchObject({ itemType: 'file', itemLabel: 'planta-baixa.pdf', reason: 'Versão errada', requestedBy: member.user.name, project: { name: 'Casa Alecrim' } });

    const ok = await app.inject({ method: 'POST', url: `/deletion-requests/${req.json().id}/approve`, headers: admin.headers });
    expect(ok.statusCode).toBe(200);
    expect(drive.folders.get(driveFileId)!.trashed).toBe(true);
    const [file] = await db.select().from(schema.projectFiles).where(eq(schema.projectFiles.id, fileId));
    expect(file.deletedAt).not.toBeNull();
    expect((await app.inject({ method: 'GET', url: `/projects/${project.id}/files`, headers: member.headers })).json()).toEqual([]);
    const [r] = await db.select().from(schema.deletionRequests);
    expect(r).toMatchObject({ status: 'approved', decidedBy: admin.user.id });
    const actions = (await db.select().from(schema.auditLog)).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['deletion.request', 'deletion.approve', 'file.delete']));
  });

  it('administrador recusa e nada é apagado', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const { done, driveFileId } = await upload(member.headers, project.id);
    const req = (await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'file', itemId: done.json().id } })).json();
    drive.resetCalls();
    const res = await app.inject({ method: 'POST', url: `/deletion-requests/${req.id}/reject`, headers: admin.headers });
    expect(res.statusCode).toBe(200);
    expect(drive.calls).toEqual([]);
    expect(drive.folders.get(driveFileId)!.trashed).toBe(false);
    const list = (await app.inject({ method: 'GET', url: `/projects/${project.id}/files`, headers: member.headers })).json();
    expect(list).toHaveLength(1);
    expect(list[0].pendingDeletion).toBe(false);
    const [r] = await db.select().from(schema.deletionRequests);
    expect(r.status).toBe('rejected');
  });

  it('não dá para pedir de novo enquanto o pedido estiver pendente', async () => {
    const member = await as('member');
    const project = await newProject(member.headers);
    const { done } = await upload(member.headers, project.id);
    const first = await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'file', itemId: done.json().id } });
    const second = await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'file', itemId: done.json().id } });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe('already_pending');
  });

  it('quem pediu não aprova nem recusa o próprio pedido', async () => {
    const admin = await as('admin');
    const project = await newProject(admin.headers);
    const note = (await app.inject({ method: 'POST', url: `/projects/${project.id}/notes`, headers: admin.headers, payload: { body: 'x' } })).json();
    const req = (await app.inject({ method: 'POST', url: '/deletion-requests', headers: admin.headers, payload: { itemType: 'note', itemId: note.id } })).json();
    for (const action of ['approve', 'reject']) {
      const res = await app.inject({ method: 'POST', url: `/deletion-requests/${req.id}/${action}`, headers: admin.headers });
      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('own_request');
    }
  });

  it('se o Drive falhar ao aprovar, o pedido continua pendente e o arquivo fica', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const { done } = await upload(member.headers, project.id);
    const req = (await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'file', itemId: done.json().id } })).json();
    drive.failOn = { op: 'trashFile' };
    const res = await app.inject({ method: 'POST', url: `/deletion-requests/${req.id}/approve`, headers: admin.headers });
    expect(res.statusCode).toBe(502);
    const [r] = await db.select().from(schema.deletionRequests);
    expect(r.status).toBe('pending');
    const [f] = await db.select().from(schema.projectFiles);
    expect(f.deletedAt).toBeNull();
  });

  it('aprovar nota apaga só no ERP; aprovar projeto manda a pasta para a lixeira do Drive (Fase 3c)', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const note = (await app.inject({ method: 'POST', url: `/projects/${project.id}/notes`, headers: member.headers, payload: { body: 'x' } })).json();
    const r1 = (await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'note', itemId: note.id } })).json();
    const r2 = (await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'project', itemId: project.id } })).json();
    drive.resetCalls();
    expect((await app.inject({ method: 'POST', url: `/deletion-requests/${r1.id}/approve`, headers: admin.headers })).statusCode).toBe(200);
    expect(drive.calls).toEqual([]);
    expect((await app.inject({ method: 'POST', url: `/deletion-requests/${r2.id}/approve`, headers: admin.headers })).statusCode).toBe(200);
    expect(drive.calls).toEqual(['trashFolder']);
    const [n] = await db.select().from(schema.projectNotes);
    expect(n.deletedAt).not.toBeNull();
    const [p] = await db.select().from(schema.projects);
    expect(p.deletedAt).not.toBeNull();
    expect(drive.folders.get(project.driveFolderId)!.trashed).toBe(true);
  });

  it('aprovar duas vezes: 409', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const note = (await app.inject({ method: 'POST', url: `/projects/${project.id}/notes`, headers: member.headers, payload: { body: 'x' } })).json();
    const req = (await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'note', itemId: note.id } })).json();
    await app.inject({ method: 'POST', url: `/deletion-requests/${req.id}/approve`, headers: admin.headers });
    const again = await app.inject({ method: 'POST', url: `/deletion-requests/${req.id}/approve`, headers: admin.headers });
    expect(again.statusCode).toBe(409);
    expect(again.json().error).toBe('not_pending');
  });

  it('exclusão direta do administrador fecha o pedido pendente do item', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const { done, driveFileId } = await upload(member.headers, project.id);
    await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'file', itemId: done.json().id } });
    const res = await app.inject({ method: 'DELETE', url: `/files/${done.json().id}`, headers: admin.headers });
    expect(res.statusCode).toBe(204);
    expect(drive.folders.get(driveFileId)!.trashed).toBe(true);
    const [r] = await db.select().from(schema.deletionRequests);
    expect(r).toMatchObject({ status: 'approved', decidedBy: admin.user.id });
  });

  it('não dá para pedir a exclusão de item que já saiu', async () => {
    const admin = await as('admin');
    const member = await as('member');
    const project = await newProject(member.headers);
    const note = (await app.inject({ method: 'POST', url: `/projects/${project.id}/notes`, headers: member.headers, payload: { body: 'x' } })).json();
    await app.inject({ method: 'DELETE', url: `/notes/${note.id}`, headers: admin.headers });
    const res = await app.inject({ method: 'POST', url: '/deletion-requests', headers: member.headers, payload: { itemType: 'note', itemId: note.id } });
    expect(res.statusCode).toBe(404);
  });
});
