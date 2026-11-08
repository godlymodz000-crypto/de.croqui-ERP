// Fase 6b, etapa E9: "Salvar em PDF" da apresentação. Banco em memória (PGlite), Drive simulado (FakeDrive) e
// um gerador de PDF falso, sem navegador: nenhum teste fala com o Google nem grava no Drive de produção. A
// impressão real com o Chromium (folha A4 deitada e medida do conteúdo) é testada à parte, no fim do arquivo,
// só quando há um navegador local. Nenhum teste apaga ou altera linhas de audit_log; só lê.
import { existsSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { asc, eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import { presentationSourceHash } from '../api/_app/presentation-files.js';
import { presentationHtml, type PresentationPdf, type PresentationPdfInput, type PresentationPdfRenderer } from '../api/_app/presentation-pdf.js';
import { isCalendarDate, pdfIssueDate, presentationPdfName, todayInStudio } from '../src/shared/file-names.js';
import { emptyPresentation, type PresentationData } from '../src/shared/presentation-data.js';
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

/** Gerador falso: devolve um PDF mínimo e guarda o que recebeu. `fail` e `overflow` simulam os erros. */
class FakePdf implements PresentationPdfRenderer {
  calls: PresentationPdfInput[] = [];
  fail = false;
  overflow = false;
  async render(input: PresentationPdfInput): Promise<PresentationPdf> {
    this.calls.push(input);
    if (this.fail) throw new Error('navegador caiu');
    if (this.overflow) return { ok: false, overflow: [{ page: 0, parts: ['nome'] }] };
    return { ok: true, pdf: new TextEncoder().encode(`%PDF-1.7 capa de ${input.data.projeto.nome}`), pages: input.data.paginas.length };
  }
}

let db: Db;
let app: FastifyInstance;
let drive: FakeDrive;
let pdf: FakePdf;
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
  number: number;
  updatedAt: string;
  data: PresentationData;
}

/** Cria e preenche a apresentação (dados fictícios), como o editor faria. */
async function presentation(name: string, projectId?: string, projeto: Partial<PresentationData['projeto']> = {}): Promise<Pres> {
  const res = await app.inject({ method: 'POST', url: '/presentations', headers: member, payload: { name, ...(projectId ? { projectId } : {}) } });
  expect(res.statusCode).toBe(201);
  const p = res.json() as Pres;
  return edit(p.id, (d) => ({ ...d, projeto: { ...d.projeto, cliente: 'Cliente Teste', data: '2026-11-07', ...projeto } }));
}

async function current(id: string): Promise<Pres> {
  return (await app.inject({ method: 'GET', url: `/presentations/${id}`, headers: member })).json();
}

/** Altera como o salvamento automático faria (por cima do que está gravado). */
async function edit(id: string, change: (d: PresentationData) => PresentationData, name?: string): Promise<Pres> {
  const now = await current(id);
  const res = await app.inject({ method: 'PATCH', url: `/presentations/${id}`, headers: member, payload: { data: change(now.data), ...(name ? { name } : {}) } });
  expect(res.statusCode).toBe(200);
  return res.json();
}

async function upload(presId: string, name: string) {
  const open = await app.inject({
    method: 'POST',
    url: `/presentations/${presId}/images/uploads`,
    headers: member,
    payload: { name, mimeType: 'image/jpeg', size: 1000, width: 4000, height: 2667 },
  });
  expect(open.statusCode).toBe(201);
  const driveFileId = drive.browserUpload(open.json().uploadUrl);
  const done = await app.inject({ method: 'POST', url: `/presentations/${presId}/images/complete`, headers: member, payload: { token: open.json().token, driveFileId } });
  expect(done.statusCode).toBe(201);
  return { id: done.json().id as string, driveFileId };
}

const setCover = (id: string, imageId: string) =>
  edit(id, (d) => ({ ...d, paginas: [{ ...d.paginas[0], imagem: { id: imageId, ajuste: 'fill', zoom: 1.25, x: 40, y: 60 } }] }));

const exportPdf = (id: string, headers: Headers = member) => app.inject({ method: 'POST', url: `/presentations/${id}/pdf`, headers });

async function row(id: string) {
  const [p] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, id));
  return p;
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action)).orderBy(asc(schema.auditLog.at));
}

/** Caminho da pasta de um item no Drive simulado, do topo até ele. */
function pathOf(id: string): string[] {
  const out: string[] = [];
  for (let cur = drive.folders.get(id)?.parentId ?? null; cur; cur = drive.folders.get(cur)?.parentId ?? null) {
    out.unshift(drive.folders.get(cur)?.name ?? cur);
  }
  return out;
}

const pdfFiles = () => [...drive.folders.values()].filter((f) => !f.folder && f.mimeType === 'application/pdf');

beforeEach(async () => {
  const pg = new PGlite();
  db = drizzle(pg, { schema }) as unknown as Db;
  await migrate(db as never, { migrationsFolder: './drizzle' });
  drive = new FakeDrive();
  pdf = new FakePdf();
  app = await buildApp({ config, db, drive, presentationPdf: pdf, calendar: new FakeCalendar() });
  // O administrador já vem das migrações.
  const [a] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  admin = await login(a.id);
  member = await person('member');
  viewer = await person('viewer');
});

afterEach(async () => {
  await app.close();
});

describe('nome do arquivo e data de emissão (P7)', () => {
  it('segue o padrão do orçamento, com a versão a partir da segunda', () => {
    expect(presentationPdfName({ name: 'Apresentação do anteprojeto', number: 3, issueDate: '2026-11-07', version: 1 })).toBe(
      'Apresentacao-3-Apresentacao-do-anteprojeto-2026-11-07.pdf',
    );
    expect(presentationPdfName({ name: 'Estudo / fachada', number: 12, issueDate: '2026-11-07', version: 3 })).toBe('Apresentacao-12-Estudo-fachada-2026-11-07-v3.pdf');
  });

  it('usa a data de emissão quando é uma data válida; senão, a de hoje em São Paulo', () => {
    const now = new Date('2026-11-08T01:30:00Z'); // ainda dia 7 em São Paulo
    expect(pdfIssueDate('2026-10-20', now)).toBe('2026-10-20');
    expect(pdfIssueDate('', now)).toBe('2026-11-07');
    expect(pdfIssueDate('2026-02-30', now)).toBe('2026-11-07');
    expect(pdfIssueDate(null, now)).toBe(todayInStudio(now));
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-13-01')).toBe(false);
  });
});

describe('POST /presentations/:id/pdf', () => {
  it('avulsa: gera com a capa, salva em De.Croqui ERP/Avulsos e grava o PDF na apresentação', async () => {
    const p = await presentation('Estudo para cliente novo', undefined, { nome: 'Casa Exemplo' });
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    const body = res.json();
    const name = `Apresentacao-${p.number}-Estudo-para-cliente-novo-2026-11-07.pdf`;
    expect(body.file).toMatchObject({ name, version: 1, pages: 1 });
    expect(body.presentation.pdf).toMatchObject({ name, version: 1, driveFileId: body.file.driveFileId });

    // O gerador recebeu o que está gravado: a capa, com os dados da aba Projeto.
    expect(pdf.calls).toHaveLength(1);
    expect(pdf.calls[0].data.paginas.map((pg) => pg.tipo)).toEqual(['capa']);
    expect(pdf.calls[0].data.projeto.nome).toBe('Casa Exemplo');

    const file = drive.folders.get(body.file.driveFileId)!;
    expect(file.name).toBe(name);
    expect(pathOf(file.id)).toEqual(['De.Croqui ERP', 'Avulsos']);
    expect(new TextDecoder().decode(drive.contents.get(file.id))).toContain('%PDF');

    const r = await row(p.id);
    expect(r).toMatchObject({ pdfDriveFileId: file.id, pdfName: name, pdfVersion: 1 });
    expect(r.pdfExportedAt).toBeInstanceOf(Date);
    expect(r.pdfSourceHash).toBe(presentationSourceHash({ data: (await current(p.id)).data, name: 'Estudo para cliente novo', projectId: null, number: p.number }));
    // Exportar não altera o documento: o editor aberto não recebe conflito.
    expect(r.updatedAt.toISOString()).toBe(p.updatedAt);

    const [log] = await auditRows('presentation.export');
    expect(log).toMatchObject({ entity: 'presentation', entityId: p.id });
    expect(log.payload).toMatchObject({ number: p.number, fileName: name, version: 1, driveFileId: file.id, pages: 1, folder: 'avulsos', projectId: null });
    // Avulsa não tem Arquivos de projeto.
    expect(await db.select().from(schema.projectFiles)).toHaveLength(0);
  });

  it('de projeto: salva em <projeto>/Apresentações e aparece em Arquivos do projeto', async () => {
    const pr = await project();
    const p = await presentation('Apresentação do anteprojeto', pr.id);
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    const file = drive.folders.get(res.json().file.driveFileId)!;
    expect(pathOf(file.id).slice(-1)).toEqual(['Apresentações']);
    expect(pathOf(file.id)).toContain('Projetos');
    const files = await db.select().from(schema.projectFiles);
    expect(files).toEqual([
      expect.objectContaining({ projectId: pr.id, driveFileId: file.id, name: file.name, subfolder: 'presentations', source: 'pdf_export', mimeType: 'application/pdf' }),
    ]);
    expect((await auditRows('presentation.export'))[0].payload).toMatchObject({ folder: 'projeto', projectId: pr.id });
  });

  it('a imagem da capa vai ao gerador na resolução do arquivo guardado, com o enquadramento', async () => {
    const pr = await project();
    const p = await presentation('Com imagem', pr.id);
    const img = await upload(p.id, 'fachada-principal.jpg');
    await setCover(p.id, img.id);
    drive.calls.length = 0;
    expect((await exportPdf(p.id)).statusCode).toBe(201);
    // O arquivo inteiro do Drive, e não a visualização de 1600 px.
    expect(drive.calls).toContain('download');
    expect(drive.calls).not.toContain('thumbnail');
    const input = pdf.calls[0];
    expect(input.data.paginas[0].imagem).toEqual({ id: img.id, ajuste: 'fill', zoom: 1.25, x: 40, y: 60 });
    expect([...input.images.keys()]).toEqual([img.id]);
    expect(input.images.get(img.id)!.body.byteLength).toBeGreaterThan(0);
  });

  it('sem data de emissão, o nome leva a data de hoje', async () => {
    const p = await presentation('Sem data', undefined, { data: '' });
    const res = await exportPdf(p.id);
    expect(res.json().file.name).toBe(`Apresentacao-${p.number}-Sem-data-${todayInStudio(new Date())}.pdf`);
  });

  it('cada exportação com mudança cria uma versão nova; a apresentação aponta para a mais recente', async () => {
    const pr = await project();
    const p = await presentation('Versões', pr.id);
    const v1 = (await exportPdf(p.id)).json().file;
    await edit(p.id, (d) => ({ ...d, projeto: { ...d.projeto, localizacao: 'Cidade Teste' } }));
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    const v2 = res.json().file;
    expect(v2).toMatchObject({ version: 2, name: `Apresentacao-${p.number}-Versoes-2026-11-07-v2.pdf` });
    expect(v2.driveFileId).not.toBe(v1.driveFileId);
    expect(res.json().presentation.pdf).toMatchObject({ version: 2, driveFileId: v2.driveFileId });
    // A versão anterior continua no Drive e em Arquivos.
    expect(drive.folders.get(v1.driveFileId)!.trashed).toBe(false);
    expect(await db.select().from(schema.projectFiles)).toHaveLength(2);
    expect((await row(p.id)).pdfVersion).toBe(2);
  });

  it('trocar o nome da apresentação também conta como mudança', async () => {
    const p = await presentation('Nome antigo');
    await exportPdf(p.id);
    await edit(p.id, (d) => d, 'Nome novo');
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    expect(res.json().file.name).toBe(`Apresentacao-${p.number}-Nome-novo-2026-11-07-v2.pdf`);
  });

  it('sem mudança desde o último PDF responde 409 no_changes com o arquivo atual e não gera outro', async () => {
    const p = await presentation('Sem mudança');
    const first = (await exportPdf(p.id)).json().file;
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'no_changes', file: { driveFileId: first.driveFileId, version: 1, name: first.name } });
    expect(pdf.calls).toHaveLength(1);
    expect(pdfFiles()).toHaveLength(1);
    expect((await row(p.id)).pdfVersion).toBe(1);
    expect(await auditRows('presentation.export')).toHaveLength(1);
  });

  it('se o PDF anterior foi para a lixeira do Drive, exporta de novo mesmo sem mudança', async () => {
    const p = await presentation('Apagado no Drive');
    const first = (await exportPdf(p.id)).json().file;
    await drive.trashFile(first.driveFileId);
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    expect(res.json().file.version).toBe(2);
  });

  it('conteúdo além do limite da página bloqueia o PDF (422) sem enviar nem gravar nada', async () => {
    const p = await presentation('Nome longo');
    pdf.overflow = true;
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(422);
    expect(res.json()).toEqual({ error: 'content_overflow', overflow: [{ page: 0, parts: ['nome'] }] });
    expect(pdfFiles()).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfName: null, pdfVersion: 0, pdfSourceHash: null });
    expect(await auditRows('presentation.export')).toHaveLength(0);
    // Corrigido, sai como v1: a versão reservada voltou.
    pdf.overflow = false;
    expect((await exportPdf(p.id)).json().file.version).toBe(1);
  });

  it('falha ao gerar responde 502 pdf_failed sem enviar nem gravar nada', async () => {
    const p = await presentation('Navegador caiu');
    pdf.fail = true;
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'pdf_failed' });
    expect(pdfFiles()).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
    expect(await auditRows('presentation.export')).toHaveLength(0);
  });

  it('falha no Drive ao enviar responde 502 drive_failed; nada é gravado e a versão volta', async () => {
    const pr = await project();
    const p = await presentation('Drive fora', pr.id);
    const v1 = (await exportPdf(p.id)).json().file;
    await edit(p.id, (d) => ({ ...d, projeto: { ...d.projeto, codigo: 'AP-01' } }));
    drive.failOn = { op: 'uploadFile' };
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed' });
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: v1.driveFileId, pdfName: v1.name, pdfVersion: 1 });
    expect(await auditRows('presentation.export')).toHaveLength(1);
    expect(await db.select().from(schema.projectFiles)).toHaveLength(1);
    drive.failOn = null;
    expect((await exportPdf(p.id)).json().file.version).toBe(2);
  });

  it('imagem que não baixa do Drive responde 502 drive_failed antes de gerar', async () => {
    const p = await presentation('Imagem fora');
    const img = await upload(p.id, 'sala.jpg');
    await setCover(p.id, img.id);
    drive.folders.get(img.driveFileId)!.size = 999 * 1048576; // maior que o limite: o Drive simulado não devolve
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed' });
    expect(pdf.calls).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
  });

  it('se o banco falhar depois do envio, o arquivo vai para a lixeira do Drive', async () => {
    const pr = await project();
    const p = await presentation('Banco fora', pr.id);
    // Logo depois do envio, a linha de Arquivos passa a ser recusada (só neste banco de teste): a transação falha.
    const upload = drive.uploadFile.bind(drive);
    drive.uploadFile = async (input) => {
      const f = await upload(input);
      await db.execute(sql`alter table project_files add constraint teste_falha check (false) not valid`);
      return f;
    };
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(500);
    const [file] = pdfFiles();
    expect(file.trashed).toBe(true);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
    expect(await auditRows('presentation.export')).toHaveLength(0);
  });

  it('só exporta quem edita: leitor recebe 403 e nada muda', async () => {
    const p = await presentation('Permissão');
    const res = await exportPdf(p.id, viewer);
    expect(res.statusCode).toBe(403);
    expect(pdf.calls).toHaveLength(0);
    expect(pdfFiles()).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
    // O leitor vê o PDF salvo por quem edita.
    await exportPdf(p.id, admin);
    const seen = await app.inject({ method: 'GET', url: `/presentations/${p.id}`, headers: viewer });
    expect(seen.json().pdf).toMatchObject({ version: 1 });
  });

  it('apresentação inexistente ou de projeto excluído responde 404', async () => {
    expect((await exportPdf('00000000-0000-0000-0000-000000000000')).statusCode).toBe(404);
    expect((await exportPdf('nao-e-id')).statusCode).toBe(404);
    const pr = await project('Excluído');
    const p = await presentation('Do excluído', pr.id);
    await db.update(schema.projects).set({ deletedAt: new Date() }).where(eq(schema.projects.id, pr.id));
    expect((await exportPdf(p.id)).statusCode).toBe(404);
  });
});

describe('vincular avulsa com PDFs exportados', () => {
  it('as versões antigas do PDF vão junto para a pasta do projeto e aparecem em Arquivos', async () => {
    const p = await presentation('Avulsa com versões');
    const v1 = (await exportPdf(p.id)).json().file;
    await edit(p.id, (d) => ({ ...d, projeto: { ...d.projeto, codigo: 'AP-02' } }));
    const v2 = (await exportPdf(p.id)).json().file;
    expect(pathOf(v1.driveFileId)).toEqual(['De.Croqui ERP', 'Avulsos']);

    const pr = await project();
    const res = await app.inject({ method: 'POST', url: `/presentations/${p.id}/link`, headers: member, payload: { projectId: pr.id } });
    expect(res.statusCode).toBe(200);
    for (const f of [v1, v2]) expect(pathOf(f.driveFileId).slice(-1)).toEqual(['Apresentações']);
    const files = await db.select().from(schema.projectFiles);
    expect(files.map((f) => f.driveFileId).sort()).toEqual([v1.driveFileId, v2.driveFileId].sort());
    expect(files.every((f) => f.subfolder === 'presentations' && f.source === 'pdf_export')).toBe(true);
    const [log] = await auditRows('presentation.link');
    expect(log.payload).toMatchObject({ pdf: { driveFileId: v2.driveFileId }, pdfs: expect.arrayContaining([expect.objectContaining({ driveFileId: v1.driveFileId })]) });
    // Depois de vinculada, a próxima exportação vai para o projeto, com a versão seguinte.
    await edit(p.id, (d) => ({ ...d, projeto: { ...d.projeto, codigo: 'AP-03' } }));
    const v3 = (await exportPdf(p.id)).json().file;
    expect(v3.version).toBe(3);
    expect(pathOf(v3.driveFileId).slice(-1)).toEqual(['Apresentações']);
  });

  it('se o Drive falhar ao mover uma versão antiga, tudo volta para Avulsos e nada muda no banco', async () => {
    const p = await presentation('Avulsa com falha');
    const v1 = (await exportPdf(p.id)).json().file;
    await edit(p.id, (d) => ({ ...d, projeto: { ...d.projeto, codigo: 'AP-04' } }));
    const v2 = (await exportPdf(p.id)).json().file;
    const pr = await project();
    drive.failOn = { op: 'moveFile', nth: 2 };
    const res = await app.inject({ method: 'POST', url: `/presentations/${p.id}/link`, headers: member, payload: { projectId: pr.id } });
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed', rolledBack: true });
    for (const f of [v1, v2]) expect(pathOf(f.driveFileId)).toEqual(['De.Croqui ERP', 'Avulsos']);
    expect((await row(p.id)).projectId).toBeNull();
    expect(await db.select().from(schema.projectFiles)).toHaveLength(0);
  });
});

describe('HTML do PDF', () => {
  const data = (): PresentationData => {
    const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Teste', localizacao: 'Cidade Teste' });
    d.projeto.data = '2026-11-07';
    return d;
  };

  it('monta a capa como sai na Prévia ligada, em A4 deitado, sem os textos de pendência', async () => {
    const html = await presentationHtml({ data: data(), images: new Map() });
    expect(html).toContain('size:297mm 210mm');
    expect(html).toContain('Projeto Teste');
    expect(html).toContain('Cliente Teste');
    expect(html).toContain('7 de novembro de 2026');
    expect(html).toContain('data-mode="print"');
    expect(html).not.toContain('Imagem da capa pendente');
    expect(html).not.toContain('Projetista'); // campo vazio não sai no PDF
    // Nada é buscado fora da página: fontes e marca embutidas.
    expect(html).toContain('data:font/woff2;base64,');
    expect(html).toContain('data:image/svg+xml;base64,');
    expect(html).not.toMatch(/(src|href)="https?:/);
  });

  it('a imagem entra embutida, com o enquadramento da capa', async () => {
    const d = data();
    const id = '11111111-2222-3333-4444-555555555555';
    d.paginas[0].imagem = { id, ajuste: 'fill', zoom: 2, x: 30, y: 70 };
    const body = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const html = await presentationHtml({ data: d, images: new Map([[id, { contentType: 'image/jpeg', body }]]) });
    expect(html).toContain(`src="data:image/jpeg;base64,${Buffer.from(body).toString('base64')}"`);
    expect(html).toContain('object-position:30% 70%');
  });
});

// Impressão real, só com navegador local (Edge ou Chrome). Na Vercel e nos computadores sem navegador, pula.
const BROWSER = [
  process.env.PDF_BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p): p is string => !!p && existsSync(p));

describe.skipIf(!BROWSER)('PDF real no Chromium local', () => {
  it('folha A4 deitada (apr-63), uma página por folha, e bloqueio do conteúdo além do limite', async () => {
    const { renderPresentationPdf } = await import('../api/_app/presentation-pdf.js');
    const { launchPdfBrowser } = await import('../api/_app/budget-pdf.js');
    const browser = await launchPdfBrowser(BROWSER);
    try {
      const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Teste' });
      const ok = await renderPresentationPdf(browser, { data: d, images: new Map() });
      expect(ok.ok).toBe(true);
      if (!ok.ok) return;
      expect(ok.pages).toBe(1);
      const text = Buffer.from(ok.pdf).toString('latin1');
      // 297 × 210 mm em pontos: 841,9 × 595,3 (o Chromium arredonda para 841,92 × 594,96).
      const box = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/.exec(text)!;
      expect(Number(box[1])).toBeCloseTo(841.9, 0);
      expect(Math.abs(Number(box[2]) - 595.3)).toBeLessThan(1);
      expect(text.match(/\/Type\s*\/Page\b/g)).toHaveLength(1);

      const long = emptyPresentation('capa', { nome: 'Nome muito longo '.repeat(20) });
      expect(await renderPresentationPdf(browser, { data: long, images: new Map() })).toEqual({ ok: false, overflow: [{ page: 0, parts: ['nome'] }] });
      const contact = emptyPresentation('capa', { nome: 'Projeto Teste' });
      contact.projeto.contato = 'contato '.repeat(30);
      expect(await renderPresentationPdf(browser, { data: contact, images: new Map() })).toEqual({ ok: false, overflow: [{ page: 0, parts: ['contato'] }] });
    } finally {
      await browser.close();
    }
  }, 60_000);
});
