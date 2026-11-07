// Testes da Fase 6b, etapa E4: imagens e biblioteca das apresentações. Banco em memória (PGlite) e Drive
// simulado (FakeDrive): nenhum teste grava no banco de produção nem fala com o Google. O envio do navegador
// ao Drive é simulado por FakeDrive.browserUpload. Nenhum teste apaga ou altera linhas de audit_log; só lê.
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

const file = { name: 'render.png', mimeType: 'image/png', size: 1000, width: 1600, height: 1131 };

async function openUpload(presId: string, payload: Record<string, unknown> = file, headers: Headers = member) {
  return app.inject({ method: 'POST', url: `/presentations/${presId}/images/uploads`, headers, payload });
}

/** Envio completo: abre a sessão, o "navegador" envia ao Drive e a API conclui. */
async function upload(presId: string, over: Partial<typeof file> = {}) {
  const input = { ...file, ...over };
  const open = await openUpload(presId, input);
  expect(open.statusCode).toBe(201);
  const driveFileId = drive.browserUpload(open.json().uploadUrl, { width: input.width, height: input.height });
  const done = await app.inject({
    method: 'POST',
    url: `/presentations/${presId}/images/complete`,
    headers: member,
    payload: { token: open.json().token, driveFileId },
  });
  expect(done.statusCode).toBe(201);
  return { ...(done.json() as { id: string; usedBy: number; mimeType: string }), driveFileId };
}

/** Salva a capa com a imagem (ou sem imagem, com null). */
async function setCover(p: Pres, imageId: string | null, headers: Headers = member) {
  const data: PresentationData = {
    ...p.data,
    paginas: [{ ...p.data.paginas[0], imagem: imageId ? { id: imageId, ajuste: 'fill', zoom: 1, x: 50, y: 50 } : null }],
  };
  return app.inject({ method: 'PATCH', url: `/presentations/${p.id}`, headers, payload: { data } });
}

async function library(presId: string, headers: Headers = member) {
  const res = await app.inject({ method: 'GET', url: `/presentations/${presId}/images`, headers });
  expect(res.statusCode).toBe(200);
  return res.json() as { id: string; usedBy: number }[];
}

async function imageRow(id: string) {
  const [row] = await db.select().from(schema.presentationImages).where(eq(schema.presentationImages.id, id));
  return row;
}

async function uses() {
  return db.select().from(schema.presentationImageUses);
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action)).orderBy(asc(schema.auditLog.at));
}

const folderPath = (id: string): string[] => {
  const f = drive.folders.get(id);
  return f ? [...(f.parentId ? folderPath(f.parentId) : []), f.name] : [];
};

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

describe('envio de imagem', () => {
  it('no projeto: sessão na pasta Apresentações/Imagens, conferência no fim e registro na biblioteca do projeto', async () => {
    const p = await project();
    const a = await presentation('Estudo', p.id);
    const open = await openUpload(a.id);
    expect(open.statusCode).toBe(201);
    const session = drive.sessions.get(open.json().uploadUrl)!;
    expect(session).toMatchObject({ name: 'render.png', mimeType: 'image/png', size: 1000, origin: 'http://localhost:5173' });
    expect(folderPath(session.parentId).slice(-2)).toEqual(['Apresentações', 'Imagens']);
    // Antes da conclusão nada é gravado.
    expect(await db.select().from(schema.presentationImages)).toHaveLength(0);

    const driveFileId = drive.browserUpload(open.json().uploadUrl, { width: 1600, height: 1131 });
    const done = await app.inject({
      method: 'POST',
      url: `/presentations/${a.id}/images/complete`,
      headers: member,
      payload: { token: open.json().token, driveFileId },
    });
    expect(done.statusCode).toBe(201);
    expect(done.json()).toMatchObject({ fileName: 'render.png', mimeType: 'image/png', widthPx: 1600, heightPx: 1131, sizeBytes: 1000, usedBy: 0, createdBy: 'member' });
    const row = await imageRow(done.json().id);
    expect(row).toMatchObject({ projectId: p.id, ownerPresentationId: null, driveFileId, trashedAt: null });
    const log = await auditRows('presentation.image_upload');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ entity: 'presentation_image', entityId: row.id, payload: { presentationId: a.id, projectId: p.id } });

    // As imagens não aparecem em Arquivos do projeto.
    expect(await db.select().from(schema.projectFiles)).toHaveLength(0);
  });

  it('as apresentações do mesmo projeto compartilham a biblioteca', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const b = await presentation('B', p.id);
    const img = await upload(a.id);
    expect((await library(b.id)).map((i) => i.id)).toEqual([img.id]);
    expect((await setCover(b, img.id)).statusCode).toBe(200);
  });

  it('na avulsa: pasta Avulsos/Imagens e biblioteca só daquela apresentação (P23)', async () => {
    const a = await presentation('Avulsa A');
    const b = await presentation('Avulsa B');
    const open = await openUpload(a.id);
    expect(folderPath(drive.sessions.get(open.json().uploadUrl)!.parentId).slice(-2)).toEqual(['Avulsos', 'Imagens']);
    const img = await upload(a.id);
    expect(await imageRow(img.id)).toMatchObject({ projectId: null, ownerPresentationId: a.id });
    expect((await library(a.id)).map((i) => i.id)).toEqual([img.id]);
    expect(await library(b.id)).toEqual([]);
    const other = await setCover(b, img.id);
    expect(other.statusCode).toBe(400);
    expect(other.json().fields).toEqual({ data: 'image_not_in_library' });
  });

  it('aceita PNG, JPEG e WebP; recusa GIF, acima de 40 MB, acima de 4000 px e nome inválido', async () => {
    const a = await presentation('Avulsa');
    for (const ok of [
      { mimeType: 'image/jpeg', name: 'foto.jpg' },
      // WebP sem redução continua WebP (decisão de 2026-11-07).
      { mimeType: 'image/webp', name: 'foto.webp' },
      { size: 40 * 1048576, width: 4000, height: 2000 },
    ]) {
      expect((await openUpload(a.id, { ...file, ...ok })).statusCode).toBe(201);
    }
    const bad: [Record<string, unknown>, Record<string, string>][] = [
      [{ mimeType: 'image/gif', name: 'anim.gif' }, { mimeType: 'unsupported' }],
      [{ mimeType: 'application/pdf' }, { mimeType: 'unsupported' }],
      [{ size: 40 * 1048576 + 1 }, { size: 'too_large' }],
      [{ size: 0 }, { size: 'invalid' }],
      [{ width: 4001 }, { dimensions: 'invalid' }],
      [{ height: 0 }, { dimensions: 'invalid' }],
      [{ width: 12.5 }, { dimensions: 'invalid' }],
      [{ name: '' }, { name: 'required' }],
      [{ name: 'pasta/render.png' }, { name: 'invalid' }],
    ];
    for (const [over, fields] of bad) {
      const res = await openUpload(a.id, { ...file, ...over });
      expect(res.statusCode, JSON.stringify(over)).toBe(400);
      expect(res.json().fields).toEqual(fields);
    }
  });

  it('o tipo guardado é o do arquivo enviado: WebP continua WebP', async () => {
    const a = await presentation('Avulsa');
    const img = await upload(a.id, { mimeType: 'image/webp', name: 'foto.webp' });
    expect(img.mimeType).toBe('image/webp');
  });

  it('arquivo que não confere com a autorização vai para a lixeira e nada é gravado', async () => {
    const a = await presentation('Avulsa');
    const cases: Partial<{ size: number; name: string; mimeType: string; width: number; height: number }>[] = [
      { size: 999 },
      { name: 'outro.png' },
      { mimeType: 'image/jpeg' },
      // Medidas lidas pelo Drive diferentes das declaradas.
      { width: 5000, height: 3535 },
    ];
    for (const over of cases) {
      const open = await openUpload(a.id);
      const id = drive.browserUpload(open.json().uploadUrl, { width: 1600, height: 1131, ...over });
      const res = await app.inject({ method: 'POST', url: `/presentations/${a.id}/images/complete`, headers: member, payload: { token: open.json().token, driveFileId: id } });
      expect(res.statusCode, JSON.stringify(over)).toBe(409);
      expect(res.json().error).toBe('upload_mismatch');
      expect(drive.folders.get(id)!.trashed).toBe(true);
    }
    expect(await db.select().from(schema.presentationImages)).toHaveLength(0);
    expect(await auditRows('presentation.image_upload')).toHaveLength(0);
  });

  it('sem medidas lidas pelo Drive, vale o que foi declarado', async () => {
    const a = await presentation('Avulsa');
    const open = await openUpload(a.id);
    const id = drive.browserUpload(open.json().uploadUrl);
    const res = await app.inject({ method: 'POST', url: `/presentations/${a.id}/images/complete`, headers: member, payload: { token: open.json().token, driveFileId: id } });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ widthPx: 1600, heightPx: 1131 });
  });

  it('autorização falsa, de outra apresentação ou de outra pessoa é recusada; arquivo fora da pasta não é tocado', async () => {
    const a = await presentation('A');
    const b = await presentation('B');
    const open = await openUpload(a.id);
    const id = drive.browserUpload(open.json().uploadUrl);
    const complete = (presId: string, payload: Record<string, unknown>, headers: Headers = member) =>
      app.inject({ method: 'POST', url: `/presentations/${presId}/images/complete`, headers, payload });
    expect((await complete(a.id, { token: 'x.y', driveFileId: id })).statusCode).toBe(400);
    expect((await complete(b.id, { token: open.json().token, driveFileId: id })).statusCode).toBe(400);
    expect((await complete(a.id, { token: open.json().token, driveFileId: id }, admin)).statusCode).toBe(400);
    expect((await complete(a.id, { token: open.json().token, driveFileId: '../x' })).statusCode).toBe(400);
    const solto = drive.browserUpload(open.json().uploadUrl, { parentId: 'pasta-de-fora' });
    expect((await complete(a.id, { token: open.json().token, driveFileId: solto })).statusCode).toBe(409);
    expect(drive.folders.get(solto)!.trashed).toBe(false);
    expect(await db.select().from(schema.presentationImages)).toHaveLength(0);
  });

  it('falha do Drive ao abrir a sessão responde 502 sem gravar nada', async () => {
    const a = await presentation('Avulsa');
    drive.failOn = { op: 'createUploadSession' };
    const res = await openUpload(a.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed' });
  });

  it('a mesma autorização não registra o arquivo duas vezes', async () => {
    const a = await presentation('Avulsa');
    const open = await openUpload(a.id);
    const id = drive.browserUpload(open.json().uploadUrl);
    const payload = { token: open.json().token, driveFileId: id };
    expect((await app.inject({ method: 'POST', url: `/presentations/${a.id}/images/complete`, headers: member, payload })).statusCode).toBe(201);
    const again = await app.inject({ method: 'POST', url: `/presentations/${a.id}/images/complete`, headers: member, payload });
    expect(again.statusCode).toBe(409);
    expect(await db.select().from(schema.presentationImages)).toHaveLength(1);
  });
});

describe('exibição', () => {
  it('a visualização recebe a imagem de 1600 px e a biblioteca, a miniatura', async () => {
    const a = await presentation('Avulsa');
    const img = await upload(a.id);
    drive.thumbnailSizes = [];
    const big = await app.inject({ method: 'GET', url: `/presentation-images/${img.id}/image`, headers: viewer });
    expect(big.statusCode).toBe(200);
    expect(big.headers['content-type']).toBe('image/jpeg');
    const small = await app.inject({ method: 'GET', url: `/presentation-images/${img.id}/thumbnail`, headers: viewer });
    expect(small.statusCode).toBe(200);
    expect(drive.thumbnailSizes).toEqual([1600, 220]);
  });

  it('sem imagem gerada pelo Drive, serve o arquivo se couber em 4 MB; senão, 404', async () => {
    const a = await presentation('Avulsa');
    const small = await upload(a.id);
    drive.noThumbnail.add(small.driveFileId);
    expect((await app.inject({ method: 'GET', url: `/presentation-images/${small.id}/image`, headers: member })).statusCode).toBe(200);
    const big = await upload(a.id, { size: 5 * 1024 * 1024, name: 'grande.png' });
    drive.noThumbnail.add(big.driveFileId);
    const res = await app.inject({ method: 'GET', url: `/presentation-images/${big.id}/image`, headers: member });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'no_image' });
  });

  it('id inválido ou inexistente responde 404', async () => {
    for (const id of ['abc', '00000000-0000-0000-0000-000000000000']) {
      expect((await app.inject({ method: 'GET', url: `/presentation-images/${id}/image`, headers: member })).statusCode).toBe(404);
    }
  });
});

describe('vínculos e regra da lixeira', () => {
  it('salvar com a imagem grava o vínculo; a biblioteca mostra quantas apresentações usam', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const img = await upload(a.id);
    expect((await setCover(a, img.id)).statusCode).toBe(200);
    expect(await uses()).toEqual([{ presentationId: a.id, imageId: img.id }]);
    expect((await library(a.id))[0].usedBy).toBe(1);
    // Salvar de novo com a mesma imagem não duplica nada.
    const again = await app.inject({ method: 'GET', url: `/presentations/${a.id}`, headers: member });
    await setCover({ ...a, data: again.json().data }, img.id);
    expect(await uses()).toHaveLength(1);
  });

  it('remover de uma apresentação só tira o vínculo enquanto outra ainda usa a imagem', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const b = await presentation('B', p.id);
    const img = await upload(a.id);
    await setCover(a, img.id);
    await setCover(b, img.id);
    expect((await setCover(a, null)).statusCode).toBe(200);
    expect(await uses()).toEqual([{ presentationId: b.id, imageId: img.id }]);
    expect((await imageRow(img.id)).trashedAt).toBeNull();
    expect(drive.folders.get(img.driveFileId)!.trashed).toBe(false);
    expect((await library(a.id)).map((i) => i.id)).toEqual([img.id]);
    expect(await auditRows('presentation.image_trash')).toHaveLength(0);
  });

  it('quando nenhuma apresentação usa mais a imagem, ela vai para a lixeira do Drive e sai da biblioteca', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const b = await presentation('B', p.id);
    const img = await upload(a.id);
    await setCover(a, img.id);
    await setCover(b, img.id);
    await setCover(a, null);
    const res = await setCover(b, null);
    expect(res.statusCode).toBe(200);
    expect(await uses()).toEqual([]);
    expect((await imageRow(img.id)).trashedAt).toBeInstanceOf(Date);
    expect(drive.folders.get(img.driveFileId)!.trashed).toBe(true);
    expect(await library(a.id)).toEqual([]);
    expect((await app.inject({ method: 'GET', url: `/presentation-images/${img.id}/image`, headers: member })).statusCode).toBe(404);
    const log = await auditRows('presentation.image_trash');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ entity: 'presentation_image', entityId: img.id, payload: { presentationId: b.id, reason: 'sem_uso' } });
    // Imagem na lixeira não pode voltar a ser usada.
    const back = await setCover(a, img.id);
    expect(back.statusCode).toBe(400);
    expect(back.json().fields).toEqual({ data: 'image_not_in_library' });
  });

  it('trocar a imagem muda o vínculo; a antiga vai para a lixeira só se ninguém mais a usa', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const b = await presentation('B', p.id);
    const x = await upload(a.id, { name: 'x.png' });
    const y = await upload(a.id, { name: 'y.png' });
    const z = await upload(a.id, { name: 'z.png' });
    await setCover(a, x.id);
    await setCover(b, y.id);
    // A troca X por Y: X fica sem uso e vai para a lixeira.
    await setCover(a, y.id);
    expect((await imageRow(x.id)).trashedAt).toBeInstanceOf(Date);
    // B troca Y por Z: Y continua em A, não vai para a lixeira.
    await setCover(b, z.id);
    expect((await imageRow(y.id)).trashedAt).toBeNull();
    expect(drive.folders.get(y.driveFileId)!.trashed).toBe(false);
    expect(
      (await uses()).map((u) => [u.presentationId === a.id ? 'A' : 'B', u.imageId === y.id ? 'Y' : 'Z']).sort(),
    ).toEqual([
      ['A', 'Y'],
      ['B', 'Z'],
    ]);
  });

  it('imagem enviada e ainda não usada não vai para a lixeira por salvamentos de outras', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const nunca = await upload(a.id, { name: 'nunca.png' });
    const usada = await upload(a.id, { name: 'usada.png' });
    await setCover(a, usada.id);
    await setCover(a, null);
    expect((await imageRow(usada.id)).trashedAt).toBeInstanceOf(Date);
    expect((await imageRow(nunca.id)).trashedAt).toBeNull();
    expect((await library(a.id)).map((i) => i.id)).toEqual([nunca.id]);
  });

  it('se o Drive falhar na lixeira, o salvamento vale e a imagem continua na biblioteca', async () => {
    const a = await presentation('Avulsa');
    const img = await upload(a.id);
    await setCover(a, img.id);
    drive.failOn = { op: 'trashFile' };
    const res = await setCover(a, null);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.paginas[0].imagem).toBeNull();
    expect(await uses()).toEqual([]);
    expect((await imageRow(img.id)).trashedAt).toBeNull();
    expect(drive.folders.get(img.driveFileId)!.trashed).toBe(false);
    expect((await library(a.id)).map((i) => i.id)).toEqual([img.id]);
    expect(await auditRows('presentation.image_trash')).toHaveLength(0);
  });

  it('salvamento recusado (conflito) não mexe em vínculos nem na lixeira', async () => {
    const a = await presentation('Avulsa');
    const img = await upload(a.id);
    const first = await setCover(a, img.id);
    const stale = await app.inject({
      method: 'PATCH',
      url: `/presentations/${a.id}`,
      headers: member,
      payload: { data: { ...a.data, paginas: [{ ...a.data.paginas[0], imagem: null }] }, baseUpdatedAt: a.updatedAt },
    });
    expect(stale.statusCode).toBe(409);
    expect(first.statusCode).toBe(200);
    expect(await uses()).toHaveLength(1);
    expect((await imageRow(img.id)).trashedAt).toBeNull();
  });
});

describe('permissões', () => {
  it('leitor não vê a biblioteca nem envia imagens, mas vê a imagem da apresentação', async () => {
    const a = await presentation('Avulsa');
    const img = await upload(a.id);
    expect((await app.inject({ method: 'GET', url: `/presentations/${a.id}/images`, headers: viewer })).statusCode).toBe(403);
    expect((await openUpload(a.id, file, viewer)).statusCode).toBe(403);
    const done = await app.inject({ method: 'POST', url: `/presentations/${a.id}/images/complete`, headers: viewer, payload: { token: 'x', driveFileId: 'y' } });
    expect(done.statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: `/presentation-images/${img.id}/image`, headers: viewer })).statusCode).toBe(200);
    expect((await library(a.id, admin)).map((i) => i.id)).toEqual([img.id]);
  });

  it('apresentação de projeto excluído: biblioteca, envio e imagens respondem 404', async () => {
    const p = await project();
    const a = await presentation('A', p.id);
    const img = await upload(a.id);
    await app.inject({ method: 'DELETE', url: `/projects/${p.id}`, headers: admin });
    expect((await app.inject({ method: 'GET', url: `/presentations/${a.id}/images`, headers: member })).statusCode).toBe(404);
    expect((await openUpload(a.id)).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: `/presentation-images/${img.id}/image`, headers: member })).statusCode).toBe(404);
  });
});
