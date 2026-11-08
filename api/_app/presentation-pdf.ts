import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Browser } from 'puppeteer-core';
import { CoverSheet } from '../../src/presentation/CoverSheet.js';
import type { PresentationData } from '../../src/shared/presentation-data.js';
import { designTokensCss, sharedPdfBrowser } from './budget-pdf.js';

/**
 * PDF da apresentação (Fase 6b, etapa E9), no mesmo padrão do orçamento (budget-pdf.ts): o mesmo componente
 * da visualização vira HTML, com o CSS das folhas, os tokens e as fontes embutidos, e o Chromium imprime.
 * A folha é A4 deitado (1123 × 794 px a 96 dpi, `apr-63`), sem margem, e sai como na Prévia ligada.
 *
 * As imagens entram na resolução do arquivo guardado no Drive (P8), embutidas como data:, para o Chromium não
 * buscar nada fora da página.
 *
 * Antes de imprimir, cada folha é medida: conteúdo que passa do limite da página bloqueia o PDF, que nunca
 * sai cortado (P14).
 */

const SRC = new URL('../../src/', import.meta.url);
const LOGO = 'design-system/assets/logo/decroqui-imagotipo-horizontal-claro.svg';

/** Imagem da biblioteca já baixada do Drive. */
export interface PdfImage {
  contentType: string;
  body: Uint8Array;
}

export type PresentationPdf =
  | { ok: true; pdf: Uint8Array; pages: number }
  /** Partes da folha que passaram do limite da página (por exemplo, "nome" ou "dados" da capa). */
  | { ok: false; overflow: { page: number; parts: string[] }[] };

export interface PresentationPdfInput {
  data: PresentationData;
  /** Imagens citadas no documento, pelo id da biblioteca. */
  images: Map<string, PdfImage>;
}

type Assets = { css: string; logo: string };
let assetsPromise: Promise<Assets> | null = null;

async function loadAssets(): Promise<Assets> {
  const read = (path: string) => readFile(new URL(path, SRC), 'utf8');
  const tokens = await designTokensCss();
  const sheets = await read('presentation/sheets.css');
  const logo = `data:image/svg+xml;base64,${Buffer.from(await read(LOGO)).toString('base64')}`;
  // Uma folha por página, sem sombra nem espaço entre elas.
  const page = '@page{size:297mm 210mm;margin:0}html,body{margin:0;padding:0}.pcover{break-after:page}.pcover:last-child{break-after:auto}';
  return { css: [tokens, sheets, page].join('\n'), logo };
}

const dataUrl = (img: PdfImage) => `data:${img.contentType};base64,${Buffer.from(img.body).toString('base64')}`;

/** HTML completo das folhas, pronto para o Chromium. */
export async function presentationHtml({ data, images }: PresentationPdfInput): Promise<string> {
  assetsPromise ??= loadAssets().catch((err) => {
    assetsPromise = null;
    throw err;
  });
  const { css, logo } = await assetsPromise;
  const sheets = data.paginas.map((page) => {
    const img = page.imagem ? images.get(page.imagem.id) : undefined;
    return createElement(CoverSheet, {
      key: page.id,
      projeto: data.projeto,
      mode: 'print',
      logoSrc: logo,
      image: img && page.imagem ? { src: dataUrl(img), ref: page.imagem } : null,
    });
  });
  const body = renderToStaticMarkup(createElement('main', null, ...sheets));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Apresentação</title><style>${css}</style></head><body>${body}</body></html>`;
}

/**
 * Mede a capa dentro do navegador: o nome não pode subir até a marca; os dados não podem passar do contato
 * nem do pé da folha; e nada sai da coluna de texto, que vai até o arco (60 + 568 px). Vai como texto, e não
 * como função: o compilador do servidor acrescenta auxiliares que não existem no navegador.
 */
export const MEASURE_SHEETS = `(() => {
  const out = [];
  document.querySelectorAll('.pcover').forEach((sheet, index) => {
    const box = sheet.getBoundingClientRect();
    const rect = (sel) => { const el = sheet.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
    const logo = rect('.pcover__logo');
    const heading = rect('.pcover__heading');
    const data = rect('.pcover__data');
    const contact = rect('.pcover__contact');
    const columnRight = box.left + 60 + 568 + 1;
    const parts = [];
    if (heading && ((logo && heading.top < logo.bottom) || heading.right > columnRight)) parts.push('nome');
    if (data && (data.bottom > (contact ? contact.top : box.bottom) || data.right > columnRight)) parts.push('dados');
    if (contact && (contact.bottom > box.bottom || contact.right > columnRight)) parts.push('contato');
    if (parts.length) out.push({ page: index, parts });
  });
  return out;
})()`;

/** Gera o PDF numa aba nova do navegador já aberto, medindo as folhas antes de imprimir. */
export async function renderPresentationPdf(browser: Browser, input: PresentationPdfInput): Promise<PresentationPdf> {
  const page = await browser.newPage();
  try {
    // 297 mm a 96 dpi: a largura da folha deitada na visualização.
    await page.setViewport({ width: 1123, height: 794 });
    await page.setContent(await presentationHtml(input), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const overflow = (await page.evaluate(MEASURE_SHEETS)) as { page: number; parts: string[] }[];
    if (overflow.length) return { ok: false, overflow };
    const pages = await page.evaluate(() => document.querySelectorAll('.pcover').length);
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    return { ok: true, pdf, pages };
  } finally {
    await page.close().catch(() => {});
  }
}

/** Quem gera o PDF da apresentação. Substituível nos testes, que não abrem navegador. */
export interface PresentationPdfRenderer {
  render(input: PresentationPdfInput): Promise<PresentationPdf>;
}

/** Gerador sobre o navegador compartilhado com o orçamento (um Chromium por instância da função). */
export function createPresentationPdfRenderer(executablePath?: string): PresentationPdfRenderer {
  return { render: async (input) => renderPresentationPdf(await sharedPdfBrowser(executablePath), input) };
}
