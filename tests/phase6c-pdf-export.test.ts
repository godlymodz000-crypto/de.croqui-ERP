// Fase 6c, etapa E6: o PDF da apresentação com todas as folhas. Banco em memória (PGlite), Drive simulado
// (FakeDrive) e um gerador de PDF falso, sem navegador: nenhum teste fala com o Google nem grava no Drive de
// produção. A impressão real com o Chromium (ordem, "NN / TT", medição de cada tipo e 40 páginas) roda no fim
// do arquivo, só quando há um navegador local. Nenhum teste apaga ou altera linhas de audit_log; só lê.
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
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
import { PDF_IMAGE_ORIGIN, pdfImageSize, PDF_IMAGE_MAX_SIDE, presentationHtml, type PdfImage, type PresentationPdf, type PresentationPdfInput, type PresentationPdfRenderer } from '../api/_app/presentation-pdf.js';
import {
  emptyPresentation,
  newPresentationPage,
  PRESENTATION_MAX_PAGES,
  type AddablePageKind,
  type PresentationData,
} from '../src/shared/presentation-data.js';
import { PDF_ERROR_TEXTS, pdfFailure, pdfOverflowText } from '../src/pages/presentations/editor.js';
import { ApiError } from '../src/api/http.js';
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

/** Gerador falso: devolve um PDF mínimo e guarda o que recebeu. `overflow` simula a folha além do limite. */
class FakePdf implements PresentationPdfRenderer {
  calls: PresentationPdfInput[] = [];
  overflow: { page: number; parts: string[] }[] | null = null;
  async render(input: PresentationPdfInput): Promise<PresentationPdf> {
    this.calls.push(input);
    if (this.overflow) return { ok: false, overflow: this.overflow };
    return { ok: true, pdf: new TextEncoder().encode(`%PDF-1.7 ${input.data.paginas.length} folhas`), pages: input.data.paginas.length };
  }
}

let db: Db;
let app: FastifyInstance;
let drive: FakeDrive;
let pdf: FakePdf;
type Headers = { cookie: string };
let member: Headers;

async function login(userId: string): Promise<Headers> {
  const { token } = await createSession(db, userId);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

interface Pres {
  id: string;
  number: number;
  data: PresentationData;
}

const KINDS: AddablePageKind[] = ['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos'];

async function current(id: string): Promise<Pres> {
  return (await app.inject({ method: 'GET', url: `/presentations/${id}`, headers: member })).json();
}

/** Altera como o salvamento automático faria (por cima do que está gravado). */
async function edit(id: string, change: (d: PresentationData) => PresentationData): Promise<Pres> {
  const now = await current(id);
  const res = await app.inject({ method: 'PATCH', url: `/presentations/${id}`, headers: member, payload: { data: change(now.data) } });
  expect(res.statusCode).toBe(200);
  return res.json();
}

/** Apresentação com a capa e as páginas dos tipos pedidos, na ordem, com dados fictícios. */
async function presentation(name: string, kinds: AddablePageKind[], projectId?: string): Promise<Pres> {
  const res = await app.inject({ method: 'POST', url: '/presentations', headers: member, payload: { name, ...(projectId ? { projectId } : {}) } });
  expect(res.statusCode).toBe(201);
  const p = res.json() as Pres;
  return edit(p.id, (d) => ({
    ...d,
    projeto: { ...d.projeto, nome: 'Projeto Teste', cliente: 'Cliente Avulso', data: '2026-11-08' },
    paginas: [d.paginas[0], ...kinds.map((k) => newPresentationPage(k, randomUUID))] as PresentationData['paginas'],
  }));
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

const exportPdf = (id: string) => app.inject({ method: 'POST', url: `/presentations/${id}/pdf`, headers: member });

async function row(id: string) {
  const [p] = await db.select().from(schema.presentations).where(eq(schema.presentations.id, id));
  return p;
}

const auditRows = (action: string) => db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action)).orderBy(asc(schema.auditLog.at));
const pdfFiles = () => [...drive.folders.values()].filter((f) => !f.folder && f.mimeType === 'application/pdf');

function pathOf(id: string): string[] {
  const out: string[] = [];
  for (let cur = drive.folders.get(id)?.parentId ?? null; cur; cur = drive.folders.get(cur)?.parentId ?? null) {
    out.unshift(drive.folders.get(cur)?.name ?? cur);
  }
  return out;
}

beforeEach(async () => {
  const pg = new PGlite();
  db = drizzle(pg, { schema }) as unknown as Db;
  await migrate(db as never, { migrationsFolder: './drizzle' });
  drive = new FakeDrive();
  pdf = new FakePdf();
  app = await buildApp({ config, db, drive, presentationPdf: pdf, calendar: new FakeCalendar() });
  const [u] = await db.insert(schema.users).values({ email: 'colaborador@exemplo.com', name: 'Colaborador Teste', role: 'member', status: 'active' }).returning();
  member = await login(u.id);
});

afterEach(async () => {
  await app.close();
});

describe('POST /presentations/:id/pdf com todas as folhas', () => {
  it('o gerador recebe a capa e as páginas na ordem da lista, e o PDF conta todas as folhas', async () => {
    const p = await presentation('Todas as folhas', KINDS);
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    expect(pdf.calls).toHaveLength(1);
    expect(pdf.calls[0].data.paginas.map((pg) => pg.tipo)).toEqual(['capa', ...KINDS]);
    expect(pdf.calls[0].data.paginas.map((pg) => pg.id)).toEqual(p.data.paginas.map((pg) => pg.id));
    expect(res.json().file).toMatchObject({ version: 1, pages: 7, name: `Apresentacao-${p.number}-Todas-as-folhas-2026-11-08.pdf` });
    const [log] = await auditRows('presentation.export');
    expect(log.payload).toMatchObject({ pages: 7, folder: 'avulsos' });
  });

  it('mudar só a ordem das páginas é mudança: sai a v2, com a ordem nova; sem mudança, 409', async () => {
    const p = await presentation('Ordem nova', ['texto', 'notas', 'direitos']);
    const v1 = (await exportPdf(p.id)).json().file;
    expect((await exportPdf(p.id)).statusCode).toBe(409);
    await edit(p.id, (d) => ({ ...d, paginas: [d.paginas[0], d.paginas[3], d.paginas[1], d.paginas[2]] as PresentationData['paginas'] }));
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    expect(res.json().file).toMatchObject({ version: 2, name: `Apresentacao-${p.number}-Ordem-nova-2026-11-08-v2.pdf` });
    expect(pdf.calls.at(-1)!.data.paginas.map((pg) => pg.tipo)).toEqual(['capa', 'direitos', 'texto', 'notas']);
    // As duas versões ficam em Avulsos; a apresentação aponta para a mais recente.
    expect(pdfFiles().map((f) => pathOf(f.id))).toEqual([
      ['De.Croqui ERP', 'Avulsos'],
      ['De.Croqui ERP', 'Avulsos'],
    ]);
    expect((await row(p.id)).pdfDriveFileId).toBe(res.json().file.driveFileId);
    expect(drive.folders.get(v1.driveFileId)!.trashed).toBe(false);
    // Sem mudança depois da v2: 409 com o arquivo atual, sem gerar outro.
    const again = await exportPdf(p.id);
    expect(again.statusCode).toBe(409);
    expect(again.json()).toMatchObject({ error: 'no_changes', file: { version: 2 } });
    expect(pdf.calls).toHaveLength(2);
  });

  it('de projeto: vai para <projeto>/Apresentações, com a v3 depois de duas mudanças', async () => {
    const pr = (await app.inject({ method: 'POST', url: '/projects', headers: member, payload: { name: 'Projeto Teste', clientName: 'Cliente Avulso' } })).json();
    const p = await presentation('Do projeto', ['moodboard'], pr.id);
    await exportPdf(p.id);
    await edit(p.id, (d) => ({ ...d, paginas: [...d.paginas, newPresentationPage('notas', randomUUID)] as PresentationData['paginas'] }));
    await exportPdf(p.id);
    await edit(p.id, (d) => ({ ...d, paginas: d.paginas.slice(0, 2) as PresentationData['paginas'] }));
    const res = await exportPdf(p.id);
    expect(res.json().file).toMatchObject({ version: 3, pages: 2, name: `Apresentacao-${p.number}-Do-projeto-2026-11-08-v3.pdf` });
    expect(pathOf(res.json().file.driveFileId).slice(-1)).toEqual(['Apresentações']);
    expect(await db.select().from(schema.projectFiles)).toHaveLength(3);
  });

  it('422 content_overflow diz a página e as partes, sem enviar nem gravar nada; corrigido, sai a v1', async () => {
    const p = await presentation('Texto longo', ['texto', 'notas']);
    pdf.overflow = [{ page: 2, parts: ['notas', 'introdução'] }];
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(422);
    expect(res.json()).toEqual({ error: 'content_overflow', overflow: [{ page: 2, parts: ['notas', 'introdução'] }] });
    expect(pdfFiles()).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0, pdfSourceHash: null });
    expect(await auditRows('presentation.export')).toHaveLength(0);
    pdf.overflow = null;
    expect((await exportPdf(p.id)).json().file.version).toBe(1);
  });

  it('40 páginas, com a capa: gera e conta as 40 folhas', async () => {
    const kinds = Array.from({ length: PRESENTATION_MAX_PAGES - 1 }, (_, i) => KINDS[i % KINDS.length]);
    const p = await presentation('Documento grande', kinds);
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(201);
    expect(res.json().file.pages).toBe(40);
    expect(pdf.calls[0].data.paginas).toHaveLength(40);
  });

  it('uma imagem usada em várias páginas é baixada do Drive uma vez, na resolução original', async () => {
    const p = await presentation('Imagens repetidas', ['visual', 'tecnico', 'moodboard']);
    const a = await upload(p.id, 'sala.jpg');
    const b = await upload(p.id, 'planta.jpg');
    const ref = (id: string) => ({ id, ajuste: 'fill' as const, zoom: 1, x: 50, y: 50 });
    await edit(p.id, (d) => {
      const [capa, visual, tecnico, mood] = d.paginas as [any, any, any, any];
      return {
        ...d,
        paginas: [
          { ...capa, imagem: ref(a.id) },
          { ...visual, imagens: [{ ...visual.imagens[0], imagem: ref(a.id) }] },
          { ...tecnico, desenhos: [{ ...tecnico.desenhos[0], imagem: ref(b.id) }] },
          { ...mood, materiais: mood.materiais.map((m: any, i: number) => (i < 2 ? { ...m, imagem: ref(i ? b.id : a.id) } : m)) },
        ],
      };
    });
    drive.calls.length = 0;
    expect((await exportPdf(p.id)).statusCode).toBe(201);
    expect(drive.calls.filter((c) => c === 'download')).toHaveLength(2);
    expect(drive.calls).not.toContain('thumbnail');
    expect([...pdf.calls[0].images.keys()].sort()).toEqual([a.id, b.id].sort());
  });

  it('falha do Drive ao baixar uma imagem de página interna: 502, nada gerado nem gravado', async () => {
    const p = await presentation('Imagem fora', ['visual']);
    const img = await upload(p.id, 'sala.jpg');
    await edit(p.id, (d) => {
      const [capa, visual] = d.paginas as [any, any];
      return { ...d, paginas: [capa, { ...visual, imagens: [{ ...visual.imagens[0], imagem: { id: img.id, ajuste: 'fill', zoom: 1, x: 50, y: 50 } }] }] };
    });
    drive.failOn = { op: 'download' };
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed' });
    expect(pdf.calls).toHaveLength(0);
    expect(pdfFiles()).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0, pdfSourceHash: null });
    expect(await auditRows('presentation.export')).toHaveLength(0);
  });

  it('falha do Drive ao enviar o PDF de várias folhas: 502, nada gravado e a versão volta', async () => {
    const p = await presentation('Envio fora', KINDS);
    drive.failOn = { op: 'uploadFile' };
    const res = await exportPdf(p.id);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: 'drive_failed' });
    expect(pdfFiles()).toHaveLength(0);
    expect(await row(p.id)).toMatchObject({ pdfDriveFileId: null, pdfVersion: 0, pdfSourceHash: null });
    expect(await auditRows('presentation.export')).toHaveLength(0);
    drive.failOn = null;
    expect((await exportPdf(p.id)).json().file).toMatchObject({ version: 1, pages: 7 });
  });
});

describe('aviso de limite na tela (P35)', () => {
  it('lê a página e as partes da resposta 422', () => {
    const err = new ApiError(422, 'content_overflow', {}, { error: 'content_overflow', overflow: [{ page: 2, parts: ['blocos', 'introdução'] }] });
    expect(pdfFailure(err)).toEqual({ kind: 'error', reason: 'overflow', overflow: [{ page: 2, parts: ['blocos', 'introdução'] }] });
    const odd = new ApiError(422, 'content_overflow', {}, { error: 'content_overflow', overflow: [{ page: 'x' }, null, { page: 1, parts: [3, 'notas'] }] });
    expect(pdfFailure(odd)).toEqual({ kind: 'error', reason: 'overflow', overflow: [{ page: 1, parts: ['notas'] }] });
  });

  it('diz a página com dois dígitos e as partes, sem exclamação', () => {
    expect(pdfOverflowText([{ page: 2, parts: ['blocos', 'introdução'] }])).toBe(
      'O PDF não foi gerado: a página 03 passou do limite da folha em blocos e introdução. Encurte os textos dessa página e tente de novo.',
    );
    expect(pdfOverflowText([{ page: 0, parts: ['nome'] }])).toBe('O PDF não foi gerado: a capa passou do limite da folha em nome. Encurte os textos dessa página e tente de novo.');
    expect(
      pdfOverflowText([
        { page: 4, parts: ['notas'] },
        { page: 11, parts: ['materiais', 'introdução', 'título'] },
      ]),
    ).toBe('O PDF não foi gerado: a página 05 (notas) e a página 12 (materiais, introdução e título) passaram do limite da folha. Encurte os textos dessas páginas e tente de novo.');
    expect(pdfOverflowText([])).toBe(PDF_ERROR_TEXTS.overflow);
    for (const t of [pdfOverflowText([{ page: 2, parts: ['blocos'] }]), PDF_ERROR_TEXTS.overflow]) expect(t).not.toContain('!');
  });
});

describe('HTML do PDF com todas as folhas', () => {
  const data = (): PresentationData => {
    const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
    d.projeto.data = '2026-11-08';
    d.paginas = [d.paginas[0], ...KINDS.map((k) => newPresentationPage(k, randomUUID))] as PresentationData['paginas'];
    return d;
  };

  it('desenha a capa e as páginas na ordem da lista, com "NN / TT" e sem os textos de pendência', async () => {
    const d = data();
    const html = await presentationHtml({ data: d, images: new Map() });
    const order = [...html.matchAll(/<div class="(pcover|psheet)"[^>]*>/g)].map((m) => (m[1] === 'pcover' ? 'capa' : /data-tipo="(\w+)"/.exec(m[0])![1]));
    expect(order).toEqual(['capa', ...KINDS]);
    const ids = [...html.matchAll(/data-page="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(d.paginas.slice(1).map((p) => p.id));
    for (let i = 2; i <= 7; i++) expect(html).toContain(`0${i} / 07`);
    expect(html).not.toContain('01 / 07'); // a capa não tem número
    expect(html).not.toContain('data-mode="edit"');
    const body = html.slice(html.indexOf('<body>'));
    expect(body).not.toContain('is-pending');
    expect(body).not.toContain('Clique ou arraste');
    expect(html).not.toMatch(/(src|href)="https?:/);
    // Uma folha por página.
    expect(html).toContain('.pcover,.psheet{break-after:page}');
  });

  it('a capa sai com a composição, a cor e a marca escolhidas; marca escura na Linho', async () => {
    const d = data();
    Object.assign(d.paginas[0], { composicao: 'tipo', cor: 'linho', marca: 'g' });
    const html = await presentationHtml({ data: d, images: new Map() });
    expect(html).toMatch(/class="pcover"[^>]*data-composicao="tipo" data-cor="linho" data-marca="g"/);
    const logo = /class="pcover__logo" src="([^"]+)"/.exec(html)![1];
    const dark = Buffer.from(logo.split(',')[1], 'base64').toString('utf8');
    Object.assign(d.paginas[0], { cor: 'vinho' });
    const light = Buffer.from(/class="pcover__logo" src="([^"]+)"/.exec(await presentationHtml({ data: d, images: new Map() }))![1].split(',')[1], 'base64').toString('utf8');
    expect(dark).not.toBe(light);
  });

  it('a mesma imagem em várias páginas entra embutida com o mesmo endereço', async () => {
    const d = data();
    const id = '11111111-2222-3333-4444-555555555555';
    const ref = { id, ajuste: 'fill' as const, zoom: 1, x: 50, y: 50 };
    (d.paginas[0] as any).imagem = ref;
    const visual = d.paginas[3] as any;
    visual.imagens[0].imagem = ref;
    const body = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const html = await presentationHtml({ data: d, images: new Map([[id, { contentType: 'image/jpeg', body }]]) });
    expect(html.split(`data:image/jpeg;base64,${Buffer.from(body).toString('base64')}`)).toHaveLength(3);
    // No PDF, a foto não vai dentro do HTML: entra pelo endereço interno, que o gerador responde.
    const linked = await presentationHtml({ data: d, images: new Map([[id, { contentType: 'image/jpeg', body }]]) }, { linked: true });
    expect(linked).not.toContain('data:image/jpeg');
    expect(linked.split(`src="${PDF_IMAGE_ORIGIN}${id}"`)).toHaveLength(3);
  });
});

// Impressão real, só com navegador local (Edge ou Chrome). Na Vercel e nos computadores sem navegador, pula.
const BROWSER = [
  process.env.PDF_BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p): p is string => !!p && existsSync(p));

describe('fotos no PDF reduzidas para 3000 px (P8, E6 da 6c)', () => {
  it('lado maior acima de 3000 px vira 3000, com a proporção mantida', () => {
    expect(PDF_IMAGE_MAX_SIDE).toBe(3000);
    expect(pdfImageSize(4000, 2500)).toEqual({ width: 3000, height: 1875 });
    expect(pdfImageSize(2250, 4000)).toEqual({ width: 1688, height: 3000 });
    expect(pdfImageSize(3001, 3001)).toEqual({ width: 3000, height: 3000 });
  });

  it('foto com 3000 px ou menos entra como está, sem ampliar', () => {
    expect(pdfImageSize(3000, 2000)).toBeNull();
    expect(pdfImageSize(1200, 800)).toBeNull();
    expect(pdfImageSize(1, 1)).toBeNull();
  });
});

describe.skipIf(!BROWSER)('PDF real no Chromium local', () => {
  const pdfPages = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  const base = (): PresentationData => {
    const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
    d.projeto.data = '2026-11-08';
    return d;
  };
  const long = (n: number) => 'Texto de exemplo para medir a folha. '.repeat(Math.ceil(n / 37)).slice(0, n);

  it('uma folha A4 deitada por página, na ordem; páginas como saem do menu não passam do limite', async () => {
    const { renderPresentationPdf } = await import('../api/_app/presentation-pdf.js');
    const { launchPdfBrowser } = await import('../api/_app/budget-pdf.js');
    const browser = await launchPdfBrowser(BROWSER);
    try {
      const d = base();
      d.paginas = [d.paginas[0], ...KINDS.map((k) => newPresentationPage(k, randomUUID))] as PresentationData['paginas'];
      const ok = await renderPresentationPdf(browser, { data: d, images: new Map() });
      expect(ok).toMatchObject({ ok: true, pages: 7 });
      if (!ok.ok) return;
      expect(pdfPages(ok.pdf)).toBe(7);
      const box = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/.exec(Buffer.from(ok.pdf).toString('latin1'))!;
      expect(Number(box[1])).toBeCloseTo(841.9, 0);
    } finally {
      await browser.close();
    }
  }, 60_000);

  it('texto além da folha bloqueia com a página e as partes de cada tipo', async () => {
    const { renderPresentationPdf } = await import('../api/_app/presentation-pdf.js');
    const { launchPdfBrowser } = await import('../api/_app/budget-pdf.js');
    const browser = await launchPdfBrowser(BROWSER);
    try {
      const d = base();
      const texto = newPresentationPage('texto', randomUUID);
      texto.blocos = texto.blocos.map((b) => (b.tipo === 'texto' ? { ...b, texto: long(2000) } : b));
      const notas = newPresentationPage('notas', randomUUID);
      notas.notas = Array.from({ length: 12 }, () => ({ id: randomUUID(), categoria: 'Notas gerais', titulo: 'Nota', texto: long(600) }));
      const direitos = newPresentationPage('direitos', randomUUID);
      direitos.autoria = 'Colaborador Teste';
      // Observações longas no desenho técnico: o texto cabe, mas esmaga o desenho numa faixa fina.
      const tecnico = newPresentationPage('tecnico', randomUUID);
      tecnico.observacoes = long(2000);
      d.paginas = [d.paginas[0], direitos, texto, notas, tecnico] as PresentationData['paginas'];
      const r = await renderPresentationPdf(browser, { data: d, images: new Map() });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.overflow.map((o) => o.page)).toEqual([2, 3, 4]);
      expect(r.overflow[0].parts).toContain('blocos');
      expect(r.overflow[1].parts).toContain('notas');
      expect(r.overflow[2].parts).toEqual(['desenhos']);
    } finally {
      await browser.close();
    }
  }, 60_000);

  it('reduz no navegador a foto acima de 3000 px, mantém a proporção e não amplia a menor', async () => {
    const { reducePdfImages, renderPresentationPdf } = await import('../api/_app/presentation-pdf.js');
    const { launchPdfBrowser } = await import('../api/_app/budget-pdf.js');
    const browser = await launchPdfBrowser(BROWSER);
    try {
      const page = await browser.newPage();
      // Fotos de teste desenhadas no próprio navegador: nenhuma vem de fora.
      const make = async (w: number, h: number, type: string): Promise<PdfImage> => {
        const url = (await page.evaluate(`(() => { const c = document.createElement('canvas'); c.width = ${w}; c.height = ${h};
          const g = c.getContext('2d'); g.fillStyle = '#8a3b2f'; g.fillRect(0, 0, ${w}, ${h}); g.fillStyle = '#f3ede4'; g.fillRect(0, 0, ${w / 2}, ${h / 2});
          return c.toDataURL('${type}', 0.9); })()`)) as string;
        return { contentType: type, body: new Uint8Array(Buffer.from(url.split(',')[1], 'base64')) };
      };
      const size = async (img: PdfImage) =>
        (await page.evaluate(`(async () => { const i = new Image(); i.src = 'data:${img.contentType};base64,${Buffer.from(img.body).toString('base64')}';
          await i.decode(); return [i.naturalWidth, i.naturalHeight]; })()`)) as [number, number];
      const images = new Map<string, PdfImage>([
        ['deitada', await make(4000, 2500, 'image/jpeg')],
        ['em-pe', await make(2250, 4000, 'image/png')],
        ['menor', await make(1200, 800, 'image/jpeg')],
      ]);
      const out = await reducePdfImages(browser, images);
      expect(await size(out.get('deitada')!)).toEqual([3000, 1875]);
      expect(out.get('deitada')!.contentType).toBe('image/jpeg');
      expect(await size(out.get('em-pe')!)).toEqual([1688, 3000]);
      expect(out.get('em-pe')!.contentType).toBe('image/png');
      // A menor não é ampliada nem recodificada: os mesmos bytes.
      expect(out.get('menor')).toBe(images.get('menor'));
      // O original continua como veio (no Drive nada muda: a redução é só da cópia do PDF).
      expect(await size(images.get('deitada')!)).toEqual([4000, 2500]);
      await page.close();

      // No PDF: a foto reduzida entra na página e o PDF sai.
      const d = base();
      const visual = newPresentationPage('visual', randomUUID);
      visual.imagens = visual.imagens.map((im, i) => (i === 0 ? { ...im, imagem: { id: 'deitada', ajuste: 'fill' as const, zoom: 1, x: 50, y: 50 } } : im)) as typeof visual.imagens;
      d.paginas = [d.paginas[0], visual] as PresentationData['paginas'];
      const r = await renderPresentationPdf(browser, { data: d, images: new Map([['deitada', images.get('deitada')!]]) });
      expect(r).toMatchObject({ ok: true, pages: 2 });
      // A foto chegou pelo endereço interno e está no PDF.
      if (r.ok) expect(Buffer.from(r.pdf).toString('latin1')).toMatch(/\/Subtype\s*\/Image/);
    } finally {
      await browser.close();
    }
  }, 60_000);

  it('40 páginas saem em 40 folhas', async () => {
    const { renderPresentationPdf } = await import('../api/_app/presentation-pdf.js');
    const { launchPdfBrowser } = await import('../api/_app/budget-pdf.js');
    const browser = await launchPdfBrowser(BROWSER);
    try {
      const d = base();
      d.paginas = [d.paginas[0], ...Array.from({ length: 39 }, (_, i) => newPresentationPage(KINDS[i % KINDS.length], randomUUID))] as PresentationData['paginas'];
      const r = await renderPresentationPdf(browser, { data: d, images: new Map() });
      expect(r).toMatchObject({ ok: true, pages: 40 });
      if (r.ok) expect(pdfPages(r.pdf)).toBe(40);
    } finally {
      await browser.close();
    }
  }, 120_000);
});
