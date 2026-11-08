// Fase 6c, etapa E3: folhas da capa completa e dos seis tipos de página (desenhos 6c-01 a 6c-20). As folhas
// são renderizadas sem navegador com react-dom/server; os testes conferem o HTML: composição, campos, cinza só
// com a Prévia desligada e imagens escondidas fora da folha.
import { beforeAll, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  emptyPresentation,
  newPresentationPage,
  newVisualImage,
  type PresentationContentPage,
  type PresentationImageRef,
  type PresentationProject,
  type PresentationTechnicalPage,
  type PresentationTextPage,
  type PresentationVisualPage,
} from '../src/shared/presentation-data';
import { coverLook, type CoverMode, type CoverOptions } from '../src/presentation/cover';
import { gridShape, moodboardColumns, pageChrome, RIGHTS_MODELS, RIGHTS_NOTE, SLOT_HINT, visibleDrawings, visibleVisualImages } from '../src/presentation/pages';

type CoverMod = typeof import('../src/presentation/CoverSheet');
type PageMod = typeof import('../src/presentation/PageSheet');
let cover: CoverMod;
let pages: PageMod;

beforeAll(async () => {
  (globalThis as { window?: unknown }).window ??= globalThis;
  cover = await import('../src/presentation/CoverSheet');
  pages = await import('../src/presentation/PageSheet');
});

const IMG_A = '11111111-1111-4111-8111-111111111111';
const IMG_B = '22222222-2222-4222-8222-222222222222';
const IMG_C = '33333333-3333-4333-8333-333333333333';
const ref = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });
const SRC: Record<string, string> = { [IMG_A]: '/img/a.png', [IMG_B]: '/img/b.png', [IMG_C]: '/img/c.png' };
const imageSrc = (id: string) => SRC[id];

let seq = 0;
const newId = () => `s${++seq}`;

function projeto(over: Partial<PresentationProject> = {}): PresentationProject {
  return { ...emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' }).projeto, data: '2026-11-01', ...over };
}

const renderCover = (options: CoverOptions, mode: CoverMode, image: { src: string; ref: PresentationImageRef } | null = null) =>
  renderToStaticMarkup(
    createElement(cover.CoverSheet, { projeto: projeto(), mode, logoSrc: '/logo-claro.svg', logoDarkSrc: '/logo-escuro.svg', image, options }),
  );

const renderPage = (page: PresentationContentPage, mode: CoverMode, p: PresentationProject = projeto()) =>
  renderToStaticMarkup(createElement(pages.PageSheet, { page, projeto: p, mode, index: 3, total: 7, imageSrc, isotipoSrc: '/isotipo.svg' }));

const count = (html: string, needle: string) => html.split(needle).length - 1;
const pending = (html: string) => count(html, 'is-pending');

describe('Fase 6c · E3 · capa completa', () => {
  it('sem opções, a capa continua a da 6b: arco, vinho, marca pequena', () => {
    const html = renderToStaticMarkup(createElement(cover.CoverSheet, { projeto: projeto(), mode: 'edit', logoSrc: '/logo-claro.svg' }));
    expect(html).toContain('data-composicao="arco" data-cor="vinho" data-marca="p"');
    expect(html).toContain('class="pcover__arch"');
    expect(html).not.toContain('pcover__photo');
    expect(html).toContain('src="/logo-claro.svg"');
  });

  it('as três composições: arco com a janela, imagem lateral inteira e só tipografia sem espaço de imagem', () => {
    const arco = renderCover({ composicao: 'arco', cor: 'vinho', marca: 'p' }, 'edit');
    expect(arco).toContain('pcover__arch');
    expect(arco).toContain('pcover__window');
    expect(arco).not.toContain('pcover__photo');

    const foto = renderCover({ composicao: 'foto', cor: 'vinho', marca: 'p' }, 'edit');
    expect(foto).toContain('pcover__photo');
    expect(foto).not.toContain('pcover__arch');
    expect(foto).not.toContain('pcover__window');
    expect(foto).toContain('Imagem da capa pendente');

    const tipo = renderCover({ composicao: 'tipo', cor: 'vinho', marca: 'p' }, 'edit');
    expect(tipo).not.toContain('pcover__arch');
    expect(tipo).not.toContain('pcover__photo');
    expect(tipo).not.toContain('Imagem da capa pendente');
  });

  it('as três cores e as três marcas ficam na folha; a capa Linho usa a marca escura', () => {
    for (const cor of ['vinho', 'noite', 'linho'] as const)
      for (const marca of ['p', 'm', 'g'] as const)
        for (const composicao of ['arco', 'foto', 'tipo'] as const) {
          const html = renderCover({ composicao, cor, marca }, 'print');
          expect(html).toContain(`data-composicao="${composicao}" data-cor="${cor}" data-marca="${marca}"`);
          expect(html).toContain(cor === 'linho' ? 'src="/logo-escuro.svg"' : 'src="/logo-claro.svg"');
          expect(coverLook({ composicao, cor, marca }).logo).toBe(cor === 'linho' ? 'escuro' : 'claro');
        }
  });

  it('com imagem, arco e lateral mostram a imagem; só tipografia guarda e não mostra (P33)', () => {
    const image = { src: '/img/a.png', ref: ref(IMG_A) };
    expect(renderCover({ composicao: 'arco', cor: 'noite', marca: 'm' }, 'print', image)).toContain('src="/img/a.png"');
    expect(renderCover({ composicao: 'foto', cor: 'linho', marca: 'g' }, 'print', image)).toContain('src="/img/a.png"');
    expect(renderCover({ composicao: 'tipo', cor: 'vinho', marca: 'p' }, 'print', image)).not.toContain('/img/a.png');
    expect(renderCover({ composicao: 'tipo', cor: 'vinho', marca: 'p' }, 'edit', image)).not.toContain('/img/a.png');
  });

  it('o cinza só aparece com a Prévia desligada; a lateral vazia some com a Prévia ligada', () => {
    for (const composicao of ['arco', 'foto', 'tipo'] as const) {
      const edit = renderCover({ composicao, cor: 'linho', marca: 'p' }, 'edit');
      const print = renderCover({ composicao, cor: 'linho', marca: 'p' }, 'print');
      expect(pending(edit), composicao).toBeGreaterThan(0);
      expect(pending(print), composicao).toBe(0);
      expect(print).not.toContain('Imagem da capa pendente');
    }
    expect(renderCover({ composicao: 'foto', cor: 'vinho', marca: 'p' }, 'print')).not.toContain('pcover__photo');
  });
});

describe('Fase 6c · E3 · páginas internas', () => {
  it('cabeçalho e rodapé: marca, projeto, seção, cliente e data, "NN / TT"', () => {
    const html = renderPage(newPresentationPage('notas', newId), 'print');
    expect(html).toContain('De.Croqui');
    expect(html).toContain('Projeto Teste');
    expect(html).toContain('Notas e diretrizes');
    expect(html).toContain('Cliente Avulso · 1 de novembro de 2026');
    expect(html).toContain('04 / 07');
    expect(pageChrome(projeto({ marca: 'Estúdio Teste' }), 'texto', 1, 12)).toMatchObject({ marca: 'Estúdio Teste', secao: 'Conceito', numero: '02 / 12' });
  });

  it('cada tipo e composição renderiza com os campos esperados', () => {
    const textLayouts = ['diagonal', 'lado', 'coluna', 'destaque', 'livre'] as const;
    for (const composicao of textLayouts) {
      const page = { ...newPresentationPage('texto', newId), composicao };
      const html = renderPage(page, 'edit');
      expect(html, composicao).toContain(`data-tipo="texto" data-composicao="${composicao}"`);
      for (const t of ['Introdução', 'Conceito do projeto', 'Conceito', 'Referências', 'Objetivos e premissas', 'Imagem de referência']) expect(html, `${composicao} ${t}`).toContain(t);
    }
    // Personalizado: posição e altura de cada imagem só valem nesta composição.
    expect(renderPage({ ...newPresentationPage('texto', newId), composicao: 'livre' }, 'edit')).toContain('data-posicao="auto" data-altura="m"');
    expect(renderPage({ ...newPresentationPage('texto', newId), composicao: 'diagonal' }, 'edit')).not.toContain('data-posicao');

    const mood = renderPage(newPresentationPage('moodboard', newId), 'edit');
    expect(count(mood, 'class="psheet__material"')).toBe(6);
    expect(count(mood, 'Textura / material')).toBe(6);
    for (const l of ['Fabricante', 'Código', 'Acabamento', 'Ambiente', 'Obs.']) expect(count(mood, `>${l}<`)).toBe(6);

    const visualLayouts: [PresentationVisualPage['composicao'], number, string][] = [
      ['lado', 1, 'Render do ambiente'],
      ['duo', 2, 'Render do ambiente'],
      ['principal', 3, 'Render do ambiente'],
      ['iso', 1, 'Vista isométrica'],
      ['grade', 4, 'Render do ambiente'],
    ];
    for (const [composicao, n, title] of visualLayouts) {
      const page: PresentationVisualPage = { ...newPresentationPage('visual', newId), composicao, imagens: Array.from({ length: n }, () => newVisualImage(newId)) };
      const html = renderPage(page, 'edit');
      expect(html, composicao).toContain(`data-composicao="${composicao}"`);
      expect(count(html, 'psheet__slot-empty'), composicao).toBe(n);
      expect(count(html, title), composicao).toBe(n);
      expect(html, composicao).toContain('Programas');
    }
    expect(renderPage({ ...newPresentationPage('visual', newId), composicao: 'iso' }, 'edit')).toContain('Ficha técnica');

    for (const composicao of ['1', '2', '3', '4'] as const) {
      const page: PresentationTechnicalPage = {
        ...newPresentationPage('tecnico', newId),
        composicao,
        desenhos: Array.from({ length: Number(composicao) }, () => ({ id: newId(), imagem: null, titulo: '' })),
      };
      const html = renderPage(page, 'edit');
      expect(count(html, 'Planta, vista ou detalhe'), composicao).toBe(Number(composicao));
      expect(html).toContain('data-tone="white"');
    }

    const notas = renderPage(newPresentationPage('notas', newId), 'edit');
    for (const c of ['Notas gerais', 'Diretrizes técnicas', 'Orientações de execução', 'Especificações']) expect(notas).toContain(c);
    expect(count(notas, 'psheet__note-num')).toBe(4);

    const direitos = renderPage(newPresentationPage('direitos', newId), 'edit');
    for (const l of ['Autoria', 'Responsável', 'Condições de uso', 'Restrições', 'Observações legais']) expect(direitos).toContain(`>${l}<`);
    expect(direitos).toContain('src="/isotipo.svg"');
    expect(direitos).toContain(RIGHTS_NOTE);
  });

  it('o cinza aparece só com a Prévia desligada; com a Prévia ligada, só o que está preenchido', () => {
    for (const tipo of ['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos'] as const) {
      const page = newPresentationPage(tipo, newId);
      const edit = renderPage(page, 'edit');
      const print = renderPage(page, 'print');
      expect(pending(edit), tipo).toBeGreaterThan(0);
      expect(pending(print), tipo).toBe(0);
      if (tipo !== 'notas' && tipo !== 'direitos') expect(edit, tipo).toContain(SLOT_HINT);
      expect(print, tipo).not.toContain(SLOT_HINT);
      expect(print, tipo).not.toContain('psheet__slot-empty');
    }
    // Os modelos dos direitos e o aviso de redação livre nunca saem no PDF.
    const dir = renderPage(newPresentationPage('direitos', newId), 'print');
    for (const m of Object.values(RIGHTS_MODELS)) expect(dir).not.toContain(m);
    expect(dir).not.toContain(RIGHTS_NOTE);
    expect(dir).not.toContain('psheet__rights-row');
    // Os títulos preenchidos continuam.
    expect(dir).toContain('Direitos autorais');
    expect(dir).toContain('Propriedade intelectual');
  });

  it('campos preenchidos aparecem nos dois modos, sem cinza', () => {
    const page: PresentationTextPage = { ...newPresentationPage('texto', newId), introducao: 'Apresentação para o Cliente Avulso.' };
    page.blocos = page.blocos.map((b) => (b.tipo === 'texto' ? { ...b, texto: 'Texto do bloco.' } : { ...b, imagem: ref(IMG_A), legenda: 'Fachada' }));
    for (const mode of ['edit', 'print'] as const) {
      const html = renderPage(page, mode);
      expect(pending(html), mode).toBe(0);
      expect(count(html, 'Texto do bloco.'), mode).toBe(3);
      expect(html, mode).toContain('Apresentação para o Cliente Avulso.');
      expect(html, mode).toContain('src="/img/a.png"');
      expect(html, mode).toContain('Fachada');
    }
  });

  it('as imagens guardadas e escondidas não aparecem na folha nem no PDF (P32)', () => {
    const page: PresentationVisualPage = {
      ...newPresentationPage('visual', newId),
      composicao: 'lado',
      imagens: [IMG_A, IMG_B, IMG_C].map((id) => ({ ...newVisualImage(newId), imagem: ref(id) })),
    };
    expect(visibleVisualImages(page).map((i) => i.imagem?.id)).toEqual([IMG_A]);
    for (const mode of ['edit', 'print'] as const) {
      const html = renderPage(page, mode);
      expect(html).toContain('/img/a.png');
      expect(html).not.toContain('/img/b.png');
      expect(html).not.toContain('/img/c.png');
    }
    // Voltar a "Principal + duas menores" traz as três de volta.
    const principal = renderPage({ ...page, composicao: 'principal' }, 'print');
    for (const s of ['/img/a.png', '/img/b.png', '/img/c.png']) expect(principal).toContain(s);
    expect(renderPage({ ...page, composicao: 'duo' }, 'print')).not.toContain('/img/c.png');

    const tec: PresentationTechnicalPage = {
      ...newPresentationPage('tecnico', newId),
      composicao: '2',
      desenhos: [IMG_A, IMG_B, IMG_C, IMG_A].map((id) => ({ id: newId(), imagem: ref(id), titulo: 'Desenho' })),
    };
    expect(visibleDrawings(tec)).toHaveLength(2);
    const html = renderPage(tec, 'print');
    expect(html).not.toContain('/img/c.png');
    expect(count(html, 'class="psheet__cell"')).toBe(2);
  });

  it('desenho técnico: escala e unidade só como texto, sem carimbo, escala gráfica nem cota', () => {
    const page: PresentationTechnicalPage = { ...newPresentationPage('tecnico', newId), escala: '1:50 · indicada', unidade: 'cm' };
    const html = renderPage(page, 'print');
    expect(html).toContain('>Escala<');
    expect(html).toContain('1:50 · indicada');
    expect(html).toContain('>Unidade<');
    expect(html).toContain('>cm<');
    for (const absent of ['Folha', 'carimbo', 'barmm', 'Esc. 1:', 'Projetista']) expect(html).not.toContain(absent);
    // Os dois vazios: a linha some com a Prévia ligada e mostra os exemplos em cinza com ela desligada.
    const vazio = newPresentationPage('tecnico', newId);
    expect(renderPage(vazio, 'print')).not.toContain('psheet__line');
    const edit = renderPage(vazio, 'edit');
    expect(edit).toContain('Ex.: 1:50 · indicada');
    expect(edit).toContain('Ex.: cm');
  });

  it('grades e colunas seguem o arquivo offline', () => {
    const v = (composicao: PresentationVisualPage['composicao'], n: number): PresentationVisualPage => ({
      ...newPresentationPage('visual', newId),
      composicao,
      imagens: Array.from({ length: n }, () => newVisualImage(newId)),
    });
    expect(gridShape(v('duo', 2))).toEqual({ cols: 'repeat(2, minmax(0, 1fr))', rows: 1 });
    expect(gridShape(v('grade', 4))).toEqual({ cols: 'repeat(2, minmax(0, 1fr))', rows: 2 });
    expect(gridShape(v('grade', 6))).toEqual({ cols: 'repeat(3, minmax(0, 1fr))', rows: 2 });
    expect(gridShape(v('grade', 8))).toEqual({ cols: 'repeat(4, minmax(0, 1fr))', rows: 2 });
    const t = (composicao: PresentationTechnicalPage['composicao']) => gridShape({ ...newPresentationPage('tecnico', newId), composicao });
    expect(t('1')).toEqual({ cols: 'repeat(1, minmax(0, 1fr))', rows: 1 });
    expect(t('3')).toEqual({ cols: 'minmax(0, 1.7fr) minmax(0, 1fr)', rows: 2 });
    expect(t('4')).toEqual({ cols: 'repeat(2, minmax(0, 1fr))', rows: 2 });
    expect([1, 4, 6, 8, 10, 12].map(moodboardColumns)).toEqual([1, 4, 3, 4, 5, 6]);
    // Principal + dois menores: o primeiro desenho ocupa as duas linhas.
    const tres: PresentationTechnicalPage = {
      ...newPresentationPage('tecnico', newId),
      composicao: '3',
      desenhos: Array.from({ length: 3 }, () => ({ id: newId(), imagem: null, titulo: '' })),
    };
    expect(renderPage(tres, 'edit')).toContain('grid-row:1 / span 2');
  });

  it('nenhum texto das folhas tem exclamação', () => {
    for (const tipo of ['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos'] as const) {
      expect(renderPage(newPresentationPage(tipo, newId), 'edit').replace(/<!--.*?-->/g, ''), tipo).not.toMatch(/!/);
    }
  });
});
