import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Browser } from 'puppeteer-core';
import { CoverSheet } from '../../src/presentation/CoverSheet.js';
import { PageSheet } from '../../src/presentation/PageSheet.js';
import type { PresentationData } from '../../src/shared/presentation-data.js';
import { designTokensCss, sharedPdfBrowser } from './budget-pdf.js';

/**
 * PDF da apresentação (Fase 6b, etapa E9; Fase 6c, etapa E6), no mesmo padrão do orçamento (budget-pdf.ts): os
 * mesmos componentes da visualização viram HTML, com o CSS das folhas, os tokens e as fontes embutidos, e o
 * Chromium imprime. Cada folha é A4 deitado (1123 × 794 px a 96 dpi, `apr-63`), sem margem, e sai como na
 * Prévia ligada: a capa com a composição, a cor e a marca escolhidas (marca escura na Linho) e as páginas
 * internas na ordem da lista, com "NN / TT" no rodapé.
 *
 * As imagens entram na resolução do arquivo guardado no Drive (P8), embutidas como data:, para o Chromium não
 * buscar nada fora da página. Uma imagem usada em várias páginas é convertida uma vez.
 *
 * Antes de imprimir, cada folha é medida: conteúdo que passa do limite da página bloqueia o PDF, que nunca
 * sai cortado (P14), e a resposta diz a página e as partes.
 */

const SRC = new URL('../../src/', import.meta.url);
const LOGO = 'design-system/assets/logo/decroqui-imagotipo-horizontal-claro.svg';
const LOGO_DARK = 'design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';
const ISOTIPO = 'design-system/assets/logo/decroqui-isotipo-escuro.svg';

/** Imagem da biblioteca já baixada do Drive. */
export interface PdfImage {
  contentType: string;
  body: Uint8Array;
}

/** Folha que passou do limite: `page` começa em 0 (a capa); `parts` são os nomes das partes, em pt-BR. */
export type PdfOverflow = { page: number; parts: string[] };

export type PresentationPdf =
  | { ok: true; pdf: Uint8Array; pages: number }
  /** Partes de cada folha que passaram do limite da página (por exemplo, "nome" da capa ou "blocos"). */
  | { ok: false; overflow: PdfOverflow[] };

export interface PresentationPdfInput {
  data: PresentationData;
  /** Imagens citadas no documento, pelo id da biblioteca. */
  images: Map<string, PdfImage>;
}

type Assets = { css: string; logo: string; logoDark: string; isotipo: string };
let assetsPromise: Promise<Assets> | null = null;

async function loadAssets(): Promise<Assets> {
  const read = (path: string) => readFile(new URL(path, SRC), 'utf8');
  const svg = async (path: string) => `data:image/svg+xml;base64,${Buffer.from(await read(path)).toString('base64')}`;
  const tokens = await designTokensCss();
  const sheets = await read('presentation/sheets.css');
  // Uma folha por página, sem sombra nem espaço entre elas.
  const page = '@page{size:297mm 210mm;margin:0}html,body{margin:0;padding:0}.pcover,.psheet{break-after:page}main>:last-child{break-after:auto}';
  return { css: [tokens, sheets, page].join('\n'), logo: await svg(LOGO), logoDark: await svg(LOGO_DARK), isotipo: await svg(ISOTIPO) };
}

const dataUrl = (img: PdfImage) => `data:${img.contentType};base64,${Buffer.from(img.body).toString('base64')}`;

/** HTML completo das folhas, na ordem da lista, pronto para o Chromium. */
export async function presentationHtml({ data, images }: PresentationPdfInput): Promise<string> {
  assetsPromise ??= loadAssets().catch((err) => {
    assetsPromise = null;
    throw err;
  });
  const { css, logo, logoDark, isotipo } = await assetsPromise;
  // Cada imagem vira data: uma vez só, mesmo usada em várias páginas.
  const urls = new Map<string, string>();
  const imageSrc = (id: string) => {
    if (!urls.has(id)) {
      const img = images.get(id);
      if (!img) return undefined;
      urls.set(id, dataUrl(img));
    }
    return urls.get(id);
  };
  const total = data.paginas.length;
  const sheets = data.paginas.map((page, index) => {
    if (page.tipo === 'capa') {
      const src = page.imagem ? imageSrc(page.imagem.id) : undefined;
      return createElement(CoverSheet, {
        key: page.id,
        projeto: data.projeto,
        mode: 'print',
        logoSrc: logo,
        logoDarkSrc: logoDark,
        options: { composicao: page.composicao, cor: page.cor, marca: page.marca },
        image: src && page.imagem ? { src, ref: page.imagem } : null,
      });
    }
    return createElement(PageSheet, { key: page.id, page, projeto: data.projeto, mode: 'print', index, total, imageSrc, isotipoSrc: isotipo });
  });
  const body = renderToStaticMarkup(createElement('main', null, ...sheets));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Apresentação</title><style>${css}</style></head><body>${body}</body></html>`;
}

/**
 * Mede as folhas dentro do navegador. Vai como texto, e não como função: o compilador do servidor acrescenta
 * auxiliares que não existem no navegador.
 *
 * Capa (6b): o nome não pode subir até a marca; os dados não podem passar do contato nem do pé da folha; e nada
 * sai da coluna de texto, que começa em 60 px e tem a largura da composição (arco 568, imagem lateral 493,
 * só tipografia 1003).
 *
 * Páginas internas (6c): cada parte marcada com `data-part` não pode sair da área entre o cabeçalho e o rodapé
 * nem ter conteúdo escondido dentro dela (texto que não coube na altura ou na largura, além da folga das letras). O cabeçalho e o rodapé
 * não podem ter texto além da largura. Os espaços de imagem não podem ser esmagados pelo texto (menos de 40 px
 * de altura ou mais de 4 vezes mais largos que altos). Se o corpo passou do limite e nenhuma parte foi achada, a parte é
 * "conteúdo", para que a recusa nunca venha sem nome.
 */
export const MEASURE_SHEETS = `(() => {
  const out = [];
  const TOL = 2;
  const COLUMN = { arco: 568, foto: 493, tipo: 1003 };
  document.querySelectorAll('main > .pcover, main > .psheet').forEach((sheet, index) => {
    const box = sheet.getBoundingClientRect();
    const parts = [];
    const add = (name) => { if (!parts.includes(name)) parts.push(name); };
    if (sheet.classList.contains('pcover')) {
      const rect = (sel) => { const el = sheet.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
      const logo = rect('.pcover__logo');
      const heading = rect('.pcover__heading');
      const data = rect('.pcover__data');
      const contact = rect('.pcover__contact');
      const columnRight = box.left + 60 + (COLUMN[sheet.dataset.composicao] || 568) + 1;
      if (heading && ((logo && heading.top < logo.bottom) || heading.right > columnRight)) add('nome');
      if (data && (data.bottom > (contact ? contact.top : box.bottom) || data.right > columnRight)) add('dados');
      if (contact && (contact.bottom > box.bottom || contact.right > columnRight)) add('contato');
    } else {
      const bodyEl = sheet.querySelector('.psheet__body');
      const body = bodyEl.getBoundingClientRect();
      // Conteúdo escondido: mais que 30% da fonte da parte (mínimo de 4 px). As fontes de título desenham as letras
      // um pouco além da linha (2 a 3 px); uma linha que de fato passou tem a altura inteira.
      const slack = (el) => Math.max(4, parseFloat(getComputedStyle(el).fontSize) * 0.3);
      const hidden = (el) => el.scrollHeight > el.clientHeight + slack(el) || el.scrollWidth > el.clientWidth + slack(el);
      sheet.querySelectorAll('[data-part]').forEach((el) => {
        const name = el.getAttribute('data-part');
        if (el.closest('.psheet__head, .psheet__foot')) {
          if (el.scrollWidth > el.clientWidth + slack(el)) add(name);
          return;
        }
        const r = el.getBoundingClientRect();
        const outside = r.bottom > body.bottom + TOL || r.right > body.right + TOL || r.top < body.top - TOL || r.left < body.left - TOL;
        if (outside || hidden(el)) add(name);
      });
      // Espaço de imagem esmagado pelo texto: mais baixo que 40 px ou mais de 4 vezes mais largo que alto. Nas
      // composições a imagem nunca fica assim; com texto demais, a grade encolhe até sumir (P14: não corta calado).
      sheet.querySelectorAll('.psheet__slot').forEach((slot) => {
        const r = slot.getBoundingClientRect();
        if (r.height < 40 || r.width > r.height * 4) {
          const holder = slot.parentElement && slot.parentElement.closest('[data-part]');
          add(holder ? holder.getAttribute('data-part') : 'imagens');
        }
      });
      if (!parts.length && hidden(bodyEl)) add('conteúdo');
    }
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
    const overflow = (await page.evaluate(MEASURE_SHEETS)) as PdfOverflow[];
    if (overflow.length) return { ok: false, overflow };
    const pages = await page.evaluate(() => document.querySelectorAll('main > .pcover, main > .psheet').length);
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
