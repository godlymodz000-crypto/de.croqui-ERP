import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Browser } from 'puppeteer-core';
import { BudgetSheets } from '../../src/budget/BudgetSheets.js';
import { ROOMS_PER_SHEET, type BudgetData } from '../../src/shared/budget-calc.js';

/**
 * PDF do orçamento gerado no servidor (opção A): o mesmo componente das folhas da prévia vira HTML,
 * com o CSS das folhas, os tokens e as fontes embutidos, e o Chromium imprime em A4.
 *
 * A divisão dos ambientes é medida aqui também: se uma folha da Opção 02 passa de 297 mm (nomes longos),
 * um ambiente por vez vai para a folha seguinte, como na prévia. Assim o PDF não depende do navegador
 * de quem clicou.
 *
 * Na Vercel o Chromium vem de @sparticuz/chromium. No computador, `executablePath` aponta para um
 * navegador instalado (Edge ou Chrome).
 */

const SRC = new URL('../../src/', import.meta.url);
const TOKEN_FILES = ['fonts', 'colors', 'typography', 'spacing', 'effects'];
const LOGO = 'design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';
/** Uma tentativa por ambiente que pode mudar de folha; 200 é o máximo de ambientes do orçamento. */
const MAX_FIT_PASSES = 200;

type Assets = { css: string; logo: string };
let assetsPromise: Promise<Assets> | null = null;

async function loadAssets(): Promise<Assets> {
  const read = (path: string) => readFile(new URL(path, SRC), 'utf8');
  const tokens = await Promise.all(TOKEN_FILES.map((name) => read(`design-system/tokens/${name}.css`)));
  // As fontes entram como data: para o Chromium não buscar nada fora da página.
  const fonts = await Promise.all(
    [...tokens[0].matchAll(/url\('\.\.\/fonts\/([\w-]+\.woff2)'\)/g)].map(async ([match, file]) => {
      const data = await readFile(new URL(`design-system/fonts/${file}`, SRC));
      return [match, `url('data:font/woff2;base64,${data.toString('base64')}')`] as const;
    }),
  );
  for (const [match, inline] of fonts) tokens[0] = tokens[0].replace(match, inline);
  const sheets = await read('budget/sheets.css');
  const logo = `data:image/svg+xml;base64,${Buffer.from(await read(LOGO)).toString('base64')}`;
  const page = 'html,body{margin:0;padding:0;background:var(--linho-50)}.bsheet{box-shadow:none}';
  return { css: [...tokens, sheets, page].join('\n'), logo };
}

/** HTML completo das folhas, pronto para o Chromium. `limits` é a divisão medida dos ambientes. */
export async function budgetHtml(data: BudgetData, limits: number[] = []): Promise<string> {
  assetsPromise ??= loadAssets().catch((err) => {
    assetsPromise = null;
    throw err;
  });
  const { css, logo } = await assetsPromise;
  const body = renderToStaticMarkup(createElement(BudgetSheets, { data, logoSrc: logo, cap: { ...ROOMS_PER_SHEET, limits } }));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento</title><style>${css}</style></head><body>${body}</body></html>`;
}

export type BudgetPdf = { pdf: Uint8Array; pages: number; limits: number[] };

/** Gera o PDF numa aba nova do navegador já aberto, medindo a divisão dos ambientes antes de imprimir. */
export async function renderBudgetPdf(browser: Browser, data: BudgetData): Promise<BudgetPdf> {
  const page = await browser.newPage();
  try {
    // 210 mm a 96 dpi: a mesma largura da folha na prévia.
    await page.setViewport({ width: 794, height: 1123 });
    let limits: number[] = [];
    for (let pass = 0; ; pass++) {
      await page.setContent(await budgetHtml(data, limits), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const overflow = await page.evaluate(() => {
        for (const sheet of document.querySelectorAll<HTMLElement>('[data-rooms-sheet]')) {
          if (sheet.scrollHeight <= sheet.clientHeight + 1) continue;
          const rows = sheet.querySelectorAll('.bsheet__line--room').length;
          if (rows > 1) return { index: Number(sheet.dataset.roomsSheet), rows };
        }
        return null;
      });
      if (!overflow || pass >= MAX_FIT_PASSES) break;
      limits = [...limits];
      limits[overflow.index] = overflow.rows - 1;
    }
    const pages = await page.evaluate(() => document.querySelectorAll('.bsheet').length);
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    return { pdf, pages, limits };
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Abre o Chromium. Sem `executablePath`, usa o @sparticuz/chromium (Linux da Vercel), que descompacta
 * o navegador na primeira chamada de cada instância. Os módulos são carregados só aqui, para não pesar
 * na partida da API.
 */
export async function launchPdfBrowser(executablePath?: string): Promise<Browser> {
  const { default: puppeteer } = await import('puppeteer-core');
  if (executablePath) return puppeteer.launch({ executablePath, headless: true, args: ['--disable-gpu', '--no-first-run'] });
  const { default: chromium } = await import('@sparticuz/chromium');
  return puppeteer.launch({ executablePath: await chromium.executablePath(), headless: true, args: chromium.args });
}
