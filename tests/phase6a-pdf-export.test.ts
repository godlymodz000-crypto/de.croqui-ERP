// Fase 6a: "Salvar em PDF" do orçamento. Banco em memória (PGlite), Drive simulado (FakeDrive) e um gerador
// de PDF falso, sem navegador: nenhum teste fala com o Google nem grava no Drive de produção.
// A impressão real com o Chromium é testada à parte (revisao-fase6a/pdf). Nenhum teste apaga ou altera
// linhas de audit_log; só lê.
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
import { ROOT_FOLDER_NAME } from '../api/_app/drive.js';
import { budgetPdfName, fileSlug, todayInStudio } from '../api/_app/budget-files.js';
import type { BudgetPdfRenderer } from '../api/_app/budget-pdf.js';
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

/** Gerador falso: devolve um PDF mínimo e guarda os dados recebidos. `fail` simula erro do navegador. */
class FakePdf implements BudgetPdfRenderer {
  calls: BudgetData[] = [];
  fail = false;
  async render(data: BudgetData) {
    this.calls.push(data);
    if (this.fail) throw new Error('navegador caiu');
    return { pdf: new TextEncoder().encode(`%PDF-1.7 orçamento de ${data.cliente}`), pages: 3, limits: [] };
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

async function project(name = 'Apartamento 302') {
  const res = await app.inject({ method: 'POST', url: '/projects', headers: member, payload: { name, clientName: 'Cliente Exemplo' } });
  expect(res.statusCode).toBe(201);
  const { id } = res.json() as { id: string };
  const [p] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
  return p;
}

/** Cria e preenche um orçamento (dados fictícios), como o editor faria. */
async function budget(name: string, projectId?: string, data: Partial<BudgetData> = {}) {
  const created = await app.inject({ method: 'POST', url: '/budgets', headers: member, payload: { name, projectId } });
  expect(created.statusCode).toBe(201);
  const b = created.json();
  const saved = await app.inject({
    method: 'PATCH',
    url: `/budgets/${b.id}`,
    headers: member,
    payload: { data: { ...emptyBudget(), cliente: 'Cliente Exemplo', data: '2026-11-04', ambientes: [{ nome: 'Sala', valor: 500 }], ...data } },
  });
  expect(saved.statusCode).toBe(200);
  return saved.json() as { id: string; number: number; updatedAt: string };
}

const exportPdf = (id: string, headers: Headers = member) => app.inject({ method: 'POST', url: `/budgets/${id}/pdf`, headers });

async function row(id: string) {
  const [b] = await db.select().from(schema.budgets).where(eq(schema.budgets.id, id));
  return b;
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

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  drive = new FakeDrive();
  pdf = new FakePdf();
  app = await buildApp({ config, db, drive, pdf, calendar: new FakeCalendar() });
  const [a] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  admin = await login(a.id);
  member = await person('member');
  viewer = await person('viewer');
});

afterEach(async () => {
  await app.close();
});

describe('geração e pasta', () => {
  it('orçamento de projeto: o PDF vai para a pasta Orçamentos do projeto e fica ligado ao orçamento', async () => {
    const p = await project();
    const b = await budget('Sala de Jantar', p.id);
    const res = await exportPdf(b.id);
    expect(res.statusCode).toBe(201);
    const { file, budget: dto } = res.json();
    const name = `Orcamento-${b.number}-Sala-de-Jantar-2026-11-04.pdf`;
    expect(file).toMatchObject({ name, version: 1, pages: 3 });

    // Gerado com o que está gravado no banco.
    expect(pdf.calls).toHaveLength(1);
    expect(pdf.calls[0]).toMatchObject({ cliente: 'Cliente Exemplo', ambientes: [{ nome: 'Sala', valor: 500 }] });

    const item = drive.folders.get(file.driveFileId)!;
    expect(item).toMatchObject({ name, mimeType: 'application/pdf', trashed: false });
    expect(drive.folders.get(item.parentId!)).toMatchObject({ name: 'Orçamentos', parentId: p.driveFolderId });
    expect(new TextDecoder().decode(drive.contents.get(file.driveFileId)).startsWith('%PDF')).toBe(true);

    expect(await row(b.id)).toMatchObject({ pdfDriveFileId: file.driveFileId, pdfName: name, pdfVersion: 1 });
    expect(dto.pdf).toMatchObject({ driveFileId: file.driveFileId, name, version: 1 });
    // Exportar não conta como edição: updated_at não muda, então o editor aberto não vê conflito.
    expect(dto.updatedAt).toBe(b.updatedAt);

    const files = await db.select().from(schema.projectFiles).where(eq(schema.projectFiles.projectId, p.id));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ driveFileId: file.driveFileId, name, subfolder: 'budgets', source: 'pdf_export' });

    const log = await auditRows('budget.export');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      entity: 'budget',
      entityId: b.id,
      payload: { fileName: name, version: 1, driveFileId: file.driveFileId, folder: 'projeto', projectId: p.id, pages: 3 },
    });
  });

  it('orçamento avulso: o PDF vai para "De.Croqui ERP/Avulsos", criada se não existir, e reaproveitada depois', async () => {
    const a = await budget('Consultoria rápida');
    const res = await exportPdf(a.id);
    expect(res.statusCode).toBe(201);
    const { file } = res.json();
    expect(pathOf(file.driveFileId)).toEqual([ROOT_FOLDER_NAME, 'Avulsos']);
    expect(await row(a.id)).toMatchObject({ pdfDriveFileId: file.driveFileId, pdfVersion: 1 });
    // Avulso não tem projeto: nada em project_files.
    expect(await db.select().from(schema.projectFiles)).toHaveLength(0);
    expect((await auditRows('budget.export'))[0].payload).toMatchObject({ folder: 'avulsos', projectId: null });

    const b = await budget('Outro avulso');
    const second = (await exportPdf(b.id)).json().file;
    expect(drive.folders.get(second.driveFileId)!.parentId).toBe(drive.folders.get(file.driveFileId)!.parentId);
    expect(drive.byName('Avulsos')).toHaveLength(1);
  });

  it('se a pasta Orçamentos ou Avulsos foi apagada no Drive, ela é criada de novo', async () => {
    const p = await project();
    const orcamentos = drive.childrenOf(p.driveFolderId).find((f) => f.name === 'Orçamentos')!;
    await drive.trashFolder(orcamentos.id);
    const b = await budget('Cozinha', p.id);
    const { file } = (await exportPdf(b.id)).json();
    const parent = drive.folders.get(drive.folders.get(file.driveFileId)!.parentId!)!;
    expect(parent).toMatchObject({ name: 'Orçamentos', parentId: p.driveFolderId, trashed: false });
    expect(parent.id).not.toBe(orcamentos.id);
  });

  it('sem Data preenchida, o nome usa a data de hoje', async () => {
    const b = await budget('Quarto', undefined, { data: '' });
    const { file } = (await exportPdf(b.id)).json();
    expect(file.name).toBe(`Orcamento-${b.number}-Quarto-${todayInStudio(new Date())}.pdf`);
  });
});

describe('permissão', () => {
  it('leitor recebe 403 chamando a rota direto, e nada é gerado nem enviado', async () => {
    const b = await budget('Sala', undefined);
    drive.resetCalls();
    const res = await exportPdf(b.id, viewer);
    expect(res.statusCode).toBe(403);
    expect(pdf.calls).toHaveLength(0);
    expect(drive.calls).toEqual([]);
    expect(await row(b.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
    expect(await auditRows('budget.export')).toHaveLength(0);
  });

  it('administrador e colaborador exportam; sem sessão, 401', async () => {
    const b = await budget('Sala');
    expect((await exportPdf(b.id, admin)).statusCode).toBe(201);
    expect((await exportPdf(b.id, member)).statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: `/budgets/${b.id}/pdf` })).statusCode).toBe(401);
  });

  it('orçamento inexistente ou de projeto excluído: 404', async () => {
    expect((await exportPdf('00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
    expect((await exportPdf('nao-e-id')).statusCode).toBe(404);
    const p = await project();
    const b = await budget('Sala', p.id);
    await db.update(schema.projects).set({ deletedAt: new Date() }).where(eq(schema.projects.id, p.id));
    expect((await exportPdf(b.id)).statusCode).toBe(404);
    expect(pdf.calls).toHaveLength(0);
  });
});

describe('nome do arquivo', () => {
  it('só letras sem acento, números, hífen e ponto', async () => {
    const b = await budget('  Ação/Reforma: "Sala" <de> Jantar? * | \\ ñ ç ã  ');
    const { file } = (await exportPdf(b.id)).json();
    expect(file.name).toBe(`Orcamento-${b.number}-Acao-Reforma-Sala-de-Jantar-n-c-a-2026-11-04.pdf`);
    expect(file.name).toMatch(/^[A-Za-z0-9-]+\.pdf$/);
  });

  it('casos de borda do nome', () => {
    expect(fileSlug('Sala de Jantar')).toBe('Sala-de-Jantar');
    expect(fileSlug('---')).toBe('Sem-nome');
    expect(fileSlug('日本語')).toBe('Sem-nome');
    expect(fileSlug('a'.repeat(200))).toHaveLength(60);
    expect(fileSlug('x'.repeat(59) + ' fim')).toBe('x'.repeat(59));
    expect(budgetPdfName({ name: 'Sala de Jantar', number: 12, issueDate: '2026-11-04', version: 1 })).toBe('Orcamento-12-Sala-de-Jantar-2026-11-04.pdf');
    expect(budgetPdfName({ name: 'Sala de Jantar', number: 12, issueDate: '2026-11-04', version: 3 })).toBe('Orcamento-12-Sala-de-Jantar-2026-11-04-v3.pdf');
  });
});

describe('falhas', () => {
  it('falha no envio ao Drive: 502, nada gravado, versão devolvida, e o orçamento segue editável', async () => {
    const b = await budget('Sala');
    drive.failOn = { op: 'uploadFile' };
    const res = await exportPdf(b.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed' });
    expect(await row(b.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
    expect(await auditRows('budget.export')).toHaveLength(0);

    const edit = await app.inject({
      method: 'PATCH',
      url: `/budgets/${b.id}`,
      headers: member,
      payload: { data: { ...emptyBudget(), cliente: 'Outro cliente' }, baseUpdatedAt: b.updatedAt },
    });
    expect(edit.statusCode).toBe(200);

    drive.failOn = null;
    const retry = await exportPdf(b.id);
    expect(retry.statusCode).toBe(201);
    expect(retry.json().file.version).toBe(1);
    expect(pdf.calls.at(-1)!.cliente).toBe('Outro cliente');
  });

  it('falha ao gerar o PDF: 502 e nada vai para o Drive', async () => {
    const b = await budget('Sala');
    pdf.fail = true;
    drive.resetCalls();
    const res = await exportPdf(b.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'pdf_failed' });
    expect(drive.calls).not.toContain('uploadFile');
    expect(await row(b.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0 });
  });
});

describe('exportar de novo', () => {
  it('cria uma nova versão (-v2); o orçamento aponta para a mais recente e a anterior continua no Drive', async () => {
    const p = await project();
    const b = await budget('Sala de Jantar', p.id);
    const first = (await exportPdf(b.id)).json().file;
    const second = (await exportPdf(b.id)).json().file;
    expect(second.name).toBe(`Orcamento-${b.number}-Sala-de-Jantar-2026-11-04-v2.pdf`);
    expect(second.version).toBe(2);
    expect(second.driveFileId).not.toBe(first.driveFileId);
    expect(drive.folders.get(first.driveFileId)!.trashed).toBe(false);

    const got = (await app.inject({ method: 'GET', url: `/budgets/${b.id}`, headers: viewer })).json();
    expect(got.pdf).toMatchObject({ driveFileId: second.driveFileId, name: second.name, version: 2 });
    const list = (await app.inject({ method: 'GET', url: `/budgets?projectId=${p.id}`, headers: viewer })).json();
    expect(list[0].pdf).toMatchObject({ version: 2 });
    // Exportar não muda "alterado por" na lista.
    expect(list[0].updatedBy).toBe('member');

    const files = await db.select().from(schema.projectFiles).where(eq(schema.projectFiles.projectId, p.id));
    expect(files.map((f) => f.name).sort()).toEqual([first.name, second.name].sort());
    expect((await auditRows('budget.export')).map((r) => (r.payload as { version: number }).version)).toEqual([1, 2]);
  });

  it('duas exportações ao mesmo tempo recebem versões diferentes', async () => {
    const b = await budget('Sala');
    const [r1, r2] = await Promise.all([exportPdf(b.id), exportPdf(b.id)]);
    expect([r1.statusCode, r2.statusCode]).toEqual([201, 201]);
    const versions = [r1.json().file.version, r2.json().file.version].sort();
    expect(versions).toEqual([1, 2]);
    expect((await row(b.id)).pdfName).toMatch(/-v2\.pdf$/);
  });
});
