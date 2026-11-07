// Testes da Fase 6b, etapa E5: vincular apresentação avulsa a um projeto. Banco em memória (PGlite) e Drive
// simulado (FakeDrive), com falha em cada passo do Drive. Nenhum teste grava no banco de produção nem fala
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
import type { PresentationData } from '../src/shared/presentation-data.js';
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

interface Pres {
  id: string;
  updatedAt: string;
  data: PresentationData;
}

async function presentation(name: string, projectId?: string): Promise<Pres> {
  const res = await app.inject({ method: 'POST', url: '/presentations', headers: member, payload: { name, ...(projectId ? { projectId } : {}) } });
  expect(res.statusCode).toBe(201);
  return res.json();
}

async function upload(presId: string, name: string) {
  const open = await app.inject({
    method: 'POST',
    url: `/presentations/${presId}/images/uploads`,
    headers: member,
    payload: { name, mimeType: 'image/png', size: 1000, width: 1600, height: 1131 },
  });
  expect(open.statusCode).toBe(201);
  const driveFileId = drive.browserUpload(open.json().uploadUrl);
  const done = await app.inject({
    method: 'POST',
    url: `/presentations/${presId}/images/complete`,
    headers: member,
    payload: { token: open.json().token, driveFileId },
  });
  expect(done.statusCode).toBe(201);
  return { id: done.json().id as string, driveFileId };
}

async function setCover(p: Pres, imageId: string | null) {
  const data: PresentationData = {
    ...p.data,
    paginas: [{ ...p.data.paginas[0], imagem: imageId ? { id: imageId, ajuste: 'fill', zoom: 1, x: 50, y: 50 } : null }],
  };
  const res = await app.inject({ method: 'PATCH', url: `/presentations/${p.id}`, headers: member, payload: { data } });
  expect(res.statusCode).toBe(200);
}

/**
 * PDF de uma avulsa, como a E9 vai gravar: arquivo em "De.Croqui ERP/Avulsos" e a apresentação apontando
 * para ele. A exportação ainda não existe nesta etapa, então o teste grava direto no banco de teste.
 */
async function givePdf(presId: string) {
  const avulsos = folderByPath(['Avulsos']) ?? drive.folders.get(await drive.createFolder('Avulsos', null))!.id;
  const file = await drive.uploadFile({ name: 'Apresentacao-1-Avulsa-2026-11-07.pdf', mimeType: 'application/pdf', parentId: avulsos, body: new Uint8Array(500) });
  await db
    .update(schema.presentations)
    .set({ pdfDriveFileId: file.id, pdfName: file.name, pdfVersion: 1, pdfExportedAt: new Date() })
    .where(eq(schema.presentations.id, presId));
  return file.id;
}

const pathOf = (id: string): string[] => {
  const f = drive.folders.get(id);
  return f ? [...(f.parentId ? pathOf(f.parentId) : []), f.name] : [];
};
/** Pasta do arquivo, pelos últimos nomes do caminho. */
const folderOf = (fileId: string) => pathOf(drive.folders.get(fileId)!.parentId!);
function folderByPath(tail: string[]) {
  return [...drive.folders.values()].find((f) => f.folder && !f.trashed && pathOf(f.id).slice(-tail.length).join('/') === tail.join('/'))?.id ?? null;
}

async function link(presId: string, projectId: unknown, headers: Headers = member) {
  return app.inject({ method: 'POST', url: `/presentations/${presId}/link`, headers, payload: { projectId } });
}

async function presRow(id: string) {
  const [row] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, id));
  return row;
}

async function imageRows() {
  return db.select().from(schema.presentationImages).orderBy(asc(schema.presentationImages.createdAt));
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action));
}

/** Avulsa com duas imagens (uma usada na capa), uma imagem já na lixeira e o PDF. */
async function filledAvulsa() {
  const a = await presentation('Avulsa');
  const usada = await upload(a.id, 'usada.png');
  const livre = await upload(a.id, 'livre.png');
  const descartada = await upload(a.id, 'descartada.png');
  await setCover(a, descartada.id);
  await setCover({ ...a, data: (await app.inject({ method: 'GET', url: `/presentations/${a.id}`, headers: member })).json().data }, usada.id);
  // "descartada" ficou sem uso e foi para a lixeira (regra da E4).
  expect(drive.folders.get(descartada.driveFileId)!.trashed).toBe(true);
  const pdf = await givePdf(a.id);
  return { a, usada, livre, descartada, pdf };
}

/** Estado do Drive e do banco que não pode mudar quando o vínculo falha. */
async function snapshot(presId: string, fileIds: string[]) {
  return {
    folders: fileIds.map((id) => [id, folderOf(id).join('/')]),
    presentation: await presRow(presId),
    images: await imageRows(),
    projectFiles: await db.select().from(schema.projectFiles),
    linkAudit: await auditRows('presentation.link'),
  };
}

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  drive = new FakeDrive();
  app = await buildApp({ config, db, drive, calendar: new FakeCalendar() });
  const [a] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  admin = await login(a.id);
  member = await person('member');
  viewer = await person('viewer');
});

afterEach(async () => {
  await app.close();
});

describe('vincular avulsa a projeto', () => {
  it('move as imagens e o PDF, passa as imagens à biblioteca do projeto e mostra o PDF em Arquivos', async () => {
    const p = await project();
    const { a, usada, livre, descartada, pdf } = await filledAvulsa();
    expect(folderOf(usada.driveFileId).slice(-2)).toEqual(['Avulsos', 'Imagens']);
    expect(folderOf(pdf).slice(-1)).toEqual(['Avulsos']);

    const res = await link(a.id, p.id);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: a.id, projectId: p.id, project: { id: p.id, name: 'Projeto Teste' } });
    // O documento não muda: os dados copiados continuam como estavam (avulsa começa vazia).
    expect(res.json().data).toEqual((await presRow(a.id)).data);

    // Drive: imagens em <projeto>/Apresentações/Imagens e o PDF em <projeto>/Apresentações. O ID não muda.
    for (const img of [usada, livre]) expect(folderOf(img.driveFileId).slice(-3)).toEqual(['Cliente Teste - Projeto Teste', 'Apresentações', 'Imagens']);
    expect(folderOf(pdf).slice(-2)).toEqual(['Cliente Teste - Projeto Teste', 'Apresentações']);
    // A que já estava na lixeira não é movida.
    expect(folderOf(descartada.driveFileId).slice(-2)).toEqual(['Avulsos', 'Imagens']);

    // Banco: todas as imagens passam ao projeto; os vínculos de uso continuam.
    expect((await imageRows()).map((i) => [i.projectId, i.ownerPresentationId])).toEqual([
      [p.id, null],
      [p.id, null],
      [p.id, null],
    ]);
    expect(await db.select().from(schema.presentationImageUses)).toEqual([{ presentationId: a.id, imageId: usada.id }]);

    // O PDF aparece em Arquivos do projeto.
    const files = await app.inject({ method: 'GET', url: `/projects/${p.id}/files`, headers: viewer });
    expect(files.statusCode).toBe(200);
    expect(JSON.stringify(files.json())).toContain('Apresentacao-1-Avulsa-2026-11-07.pdf');
    const [pf] = await db.select().from(schema.projectFiles);
    expect(pf).toMatchObject({ projectId: p.id, driveFileId: pdf, subfolder: 'presentations', source: 'pdf_export', mimeType: 'application/pdf' });

    // Biblioteca: outra apresentação do projeto vê as imagens; a avulsa saiu de "Sem projeto".
    const b = await presentation('Outra', p.id);
    const lib = await app.inject({ method: 'GET', url: `/presentations/${b.id}/images`, headers: member });
    expect(lib.json().map((i: { id: string }) => i.id).sort()).toEqual([usada.id, livre.id].sort());
    expect((await app.inject({ method: 'GET', url: '/presentations?semProjeto=1', headers: member })).json()).toEqual([]);
    expect((await app.inject({ method: 'GET', url: `/presentations?projectId=${p.id}`, headers: member })).json()).toHaveLength(2);

    const log = await auditRows('presentation.link');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      entity: 'presentation',
      entityId: a.id,
      payload: { projectId: p.id, images: 3, movedImages: 2, pdf: { driveFileId: pdf } },
    });
  });

  it('avulsa sem imagens e sem PDF só passa ao projeto', async () => {
    const p = await project();
    const a = await presentation('Avulsa');
    drive.resetCalls();
    const res = await link(a.id, p.id);
    expect(res.statusCode).toBe(200);
    expect((await presRow(a.id)).projectId).toBe(p.id);
    expect(drive.calls).not.toContain('moveFile');
    expect(await db.select().from(schema.projectFiles)).toHaveLength(0);
  });

  it('PDF que já não está no Drive não é movido nem aparece em Arquivos', async () => {
    const p = await project();
    const a = await presentation('Avulsa');
    const pdf = await givePdf(a.id);
    await drive.trashFile(pdf);
    expect((await link(a.id, p.id)).statusCode).toBe(200);
    expect(folderOf(pdf).slice(-1)).toEqual(['Avulsos']);
    expect(await db.select().from(schema.projectFiles)).toHaveLength(0);
  });

  it('imagem apagada no Drive por fora não impede o vínculo', async () => {
    const p = await project();
    const a = await presentation('Avulsa');
    const img = await upload(a.id, 'sumiu.png');
    drive.folders.delete(img.driveFileId);
    expect((await link(a.id, p.id)).statusCode).toBe(200);
    expect((await imageRows())[0]).toMatchObject({ projectId: p.id, ownerPresentationId: null });
  });
});

describe('falha do Drive no meio: nada muda no banco e o que foi movido volta', () => {
  // Passos do Drive no vínculo da avulsa completa: pasta Apresentações, consulta do PDF, mover o PDF,
  // pasta Imagens, mover a primeira imagem, mover a segunda imagem.
  const steps: { op: 'findChildFolder' | 'getFile' | 'moveFile' | 'createFolder'; nth?: number; desc: string }[] = [
    { op: 'getFile', desc: 'consulta do PDF' },
    { op: 'moveFile', nth: 1, desc: 'mover o PDF' },
    { op: 'createFolder', desc: 'criar a pasta Imagens no projeto' },
    { op: 'moveFile', nth: 2, desc: 'mover a primeira imagem' },
    { op: 'moveFile', nth: 3, desc: 'mover a segunda imagem' },
  ];

  for (const step of steps) {
    it(`falha em: ${step.desc}`, async () => {
      const p = await project();
      const { a, usada, livre, descartada, pdf } = await filledAvulsa();
      const ids = [usada.driveFileId, livre.driveFileId, descartada.driveFileId, pdf];
      // A pasta Apresentações do projeto já existe (criada com o projeto); Imagens ainda não.
      const before = await snapshot(a.id, ids);
      drive.resetCalls();
      drive.failOn = { op: step.op, nth: step.nth };

      const res = await link(a.id, p.id);
      expect(res.statusCode).toBe(502);
      expect(res.json()).toEqual({ error: 'drive_failed', rolledBack: true });
      drive.failOn = null;
      expect(await snapshot(a.id, ids)).toEqual(before);

      // Depois da falha, tentar de novo funciona.
      expect((await link(a.id, p.id)).statusCode).toBe(200);
      expect(folderOf(pdf).slice(-2)).toEqual(['Cliente Teste - Projeto Teste', 'Apresentações']);
    });
  }

  it('se devolver um arquivo também falhar, responde que não voltou tudo e o banco não muda', async () => {
    const p = await project();
    const { a, usada, livre, descartada, pdf } = await filledAvulsa();
    const ids = [usada.driveFileId, livre.driveFileId, descartada.driveFileId, pdf];
    const before = await snapshot(a.id, ids);
    // Falha ao mover a segunda imagem e, na volta, ao devolver o PDF (5ª chamada de moveFile).
    const original = drive.moveFile.bind(drive);
    let n = 0;
    drive.moveFile = async (id: string, to: string) => {
      n += 1;
      if (n === 3 || n === 5) throw new Error('falha simulada');
      return original(id, to);
    };
    const res = await link(a.id, p.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed', rolledBack: false });
    const after = await snapshot(a.id, ids);
    expect(after.presentation).toEqual(before.presentation);
    expect(after.images).toEqual(before.images);
    expect(after.projectFiles).toEqual([]);
    expect(after.linkAudit).toEqual([]);
    // A imagem que já tinha ido voltou; o PDF ficou na pasta do projeto, com o mesmo ID (o link continua valendo).
    expect(folderOf(usada.driveFileId).slice(-2)).toEqual(['Avulsos', 'Imagens']);
    expect(folderOf(pdf).slice(-2)).toEqual(['Cliente Teste - Projeto Teste', 'Apresentações']);
  });

  it('se o banco falhar depois de mover, os arquivos voltam e nada é gravado', async () => {
    const p = await project();
    const outro = await project('Outro Projeto');
    const { a, usada, livre, descartada, pdf } = await filledAvulsa();
    // Registro do mesmo arquivo em outro projeto: a gravação em Arquivos falha por duplicidade.
    await db.insert(schema.projectFiles).values({
      projectId: outro.id,
      driveFileId: pdf,
      name: 'x.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
      subfolder: 'presentations',
      source: 'pdf_export',
    });
    const ids = [usada.driveFileId, livre.driveFileId, descartada.driveFileId, pdf];
    const before = await snapshot(a.id, ids);
    const res = await link(a.id, p.id);
    expect(res.statusCode).toBe(500);
    expect(await snapshot(a.id, ids)).toEqual(before);
  });
});

describe('recusas e permissões', () => {
  it('apresentação que já é de projeto responde 409; projeto inexistente ou excluído, 400', async () => {
    const p = await project();
    const doProjeto = await presentation('Do projeto', p.id);
    expect((await link(doProjeto.id, p.id)).statusCode).toBe(409);

    const a = await presentation('Avulsa');
    const excluido = await project('Excluído');
    await app.inject({ method: 'DELETE', url: `/projects/${excluido.id}`, headers: admin });
    for (const projectId of [excluido.id, 'abc', '00000000-0000-0000-0000-000000000000', 7, undefined]) {
      const res = await link(a.id, projectId);
      expect(res.statusCode).toBe(400);
      expect(res.json().fields).toEqual({ projectId: 'not_found' });
    }
    expect((await presRow(a.id)).projectId).toBeNull();
    expect((await link(a.id, p.id)).statusCode).toBe(200);
    expect((await link(a.id, p.id)).statusCode).toBe(409);
  });

  it('leitor recebe 403 e nada muda; apresentação inexistente, 404', async () => {
    const p = await project();
    const a = await presentation('Avulsa');
    expect((await link(a.id, p.id, viewer)).statusCode).toBe(403);
    expect((await presRow(a.id)).projectId).toBeNull();
    expect((await link('00000000-0000-0000-0000-000000000000', p.id)).statusCode).toBe(404);
    expect((await link(a.id, p.id, admin)).statusCode).toBe(200);
  });

  it('orçamentos não são tocados', async () => {
    const p = await project();
    const budget = await app.inject({ method: 'POST', url: '/budgets', headers: member, payload: { name: 'Orçamento avulso' } });
    const a = await presentation('Avulsa');
    expect((await link(a.id, p.id)).statusCode).toBe(200);
    const [b] = await db.select().from(schema.budgets).where(eq(schema.budgets.id, budget.json().id));
    expect(b.projectId).toBeNull();
  });
});
