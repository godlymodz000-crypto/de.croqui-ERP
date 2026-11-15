// Fase 6c, etapa E5: aba Páginas e navegação entre páginas (desenho 6c-21). As regras da lista são funções
// puras; a aba e o diálogo de remover são renderizados sem navegador com react-dom/server.
import { beforeAll, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ADDABLE_PAGE_TYPES,
  emptyPresentation,
  newPresentationPage,
  parsePresentationData,
  PRESENTATION_MAX_PAGES,
  type AddablePageKind,
  type PresentationData,
  type PresentationImageRef,
  type PresentationVisualPage,
} from '../src/shared/presentation-data';
import {
  ADD_PAGE_OPTIONS,
  addPage,
  addPageHelp,
  addPageState,
  canMoveDown,
  canMoveUp,
  canRemove,
  canStep,
  currentAfterMove,
  currentAfterRemove,
  DUPLICATE_NOTICE,
  imagesLeaving,
  movePage,
  pageRowKind,
  pageRowName,
  pagesCountLabel,
  PAGES_LIMIT_TEXT,
  removePage,
  removePageDialog,
  stepPage,
} from '../src/pages/presentations/pagesList';
import { pageNavLabel } from '../src/shared/presentation-calc';

type TabMod = typeof import('../src/pages/presentations/PagesTab');
let mod: TabMod;

beforeAll(async () => {
  (globalThis as { window?: unknown }).window ??= globalThis;
  mod = await import('../src/pages/presentations/PagesTab');
});

let seq = 0;
const newId = () => `p${++seq}`;
const ref = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });
const IMG = (n: number) => `${String(n).repeat(8)}-1111-4111-8111-111111111111`.slice(0, 36);
const TYPES: AddablePageKind[] = ['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos'];

/** Documento como o de 6c-21: capa e uma página de cada tipo. */
function sample(): PresentationData {
  const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
  return { ...d, paginas: [d.paginas[0], ...TYPES.map((t) => newPresentationPage(t, newId))] as PresentationData['paginas'] };
}
const kinds = (d: PresentationData) => d.paginas.map((p) => p.tipo);
const valid = (d: PresentationData) => 'data' in parsePresentationData(d);

function render(data: PresentationData, opts: { current?: number; readOnly?: boolean } = {}) {
  return renderToStaticMarkup(
    createElement(mod.PagesTab, {
      data,
      current: opts.current ?? 0,
      readOnly: !!opts.readOnly,
      onSelect: () => {},
      onMove: () => {},
      onAskRemove: () => {},
      onAdd: () => {},
    }),
  );
}
const decode = (html: string) => html.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

describe('lista de páginas (6c-21)', () => {
  it('mostra a contagem, o tipo com a composição e o nome de cada página', () => {
    const d = sample();
    expect(pagesCountLabel(7)).toBe('7 páginas');
    expect(pagesCountLabel(1)).toBe('1 página');
    expect(d.paginas.map(pageRowKind)).toEqual([
      'Capa · Imagem em arco',
      'Texto & conceito · Diagonal',
      'Moodboard de materiais',
      'Apresentação visual · Imagem grande + texto ao lado',
      'Desenho técnico · Um desenho',
      'Notas técnicas',
      'Direitos autorais',
    ]);
    expect(d.paginas.map(pageRowName)).toEqual([
      'Capa',
      'Conceito do projeto',
      'Moodboard de materiais',
      'Apresentação visual',
      'Planta baixa',
      'Notas gerais e diretrizes técnicas',
      'Direitos autorais',
    ]);
    const html = decode(render(d));
    expect(html).toContain('7 páginas');
    expect(html).toContain('Texto & conceito · Diagonal');
    expect(html).toContain(DUPLICATE_NOTICE);
  });

  it('a capa aparece sem ações; as outras têm ↑ ↓, Duplicar e ×', () => {
    const html = render(sample());
    expect(html).not.toContain('Subir página 01');
    expect(html).not.toContain('Remover página 01');
    for (const n of ['02', '03', '04', '05', '06', '07']) {
      expect(html).toContain(`Subir página ${n}`);
      expect(html).toContain(`Remover página ${n}`);
    }
    expect(html.match(/>Duplicar</g)).toHaveLength(6);
  });

  it('a linha da página atual fica marcada', () => {
    const html = render(sample(), { current: 3 });
    expect(html.match(/is-active/g)).toHaveLength(1);
    expect(html).toMatch(/is-active"><button type="button" class="ppages__open" aria-current="page"><span class="ppages__number">04</);
  });

  it('quem só lê vê a lista sem ações, sem Duplicar e sem o menu de adicionar', () => {
    const html = render(sample(), { readOnly: true });
    expect(html).toContain('7 páginas');
    expect(html).not.toContain('Subir página');
    expect(html).not.toContain('Duplicar');
    expect(html).not.toContain('Adicionar página');
  });
});

describe('a capa fica sempre em primeiro', () => {
  it('a capa não sobe, não desce e não sai', () => {
    const d = sample();
    expect(canMoveUp(0)).toBe(false);
    expect(canMoveDown(0, 7)).toBe(false);
    expect(canRemove(0)).toBe(false);
    expect(movePage(d, 0, 1)).toBe(d);
    expect(movePage(d, 0, -1)).toBe(d);
    expect(removePage(d, 0)).toBe(d);
  });

  it('a página 02 não sobe acima da capa', () => {
    const d = sample();
    expect(canMoveUp(1)).toBe(false);
    expect(movePage(d, 1, -1)).toBe(d);
    expect(d.paginas[0].tipo).toBe('capa');
  });
});

describe('ordenar com ↑ ↓', () => {
  it('troca a página com a vizinha e mantém a capa em primeiro', () => {
    const d = sample();
    const down = movePage(d, 1, 1);
    expect(kinds(down)).toEqual(['capa', 'moodboard', 'texto', 'visual', 'tecnico', 'notas', 'direitos']);
    const up = movePage(down, 2, -1);
    expect(kinds(up)).toEqual(kinds(d));
    expect(valid(down)).toBe(true);
    // A página é a mesma: o que foi escrito vai junto.
    expect(down.paginas[2]).toBe(d.paginas[1]);
  });

  it('a última não desce', () => {
    const d = sample();
    expect(canMoveDown(6, 7)).toBe(false);
    expect(movePage(d, 6, 1)).toBe(d);
  });

  it('a página atual segue a página que estava sendo vista', () => {
    expect(currentAfterMove(2, 2, 1, 7)).toBe(3);
    expect(currentAfterMove(3, 2, 1, 7)).toBe(2);
    expect(currentAfterMove(5, 2, 1, 7)).toBe(5);
    expect(currentAfterMove(1, 1, -1, 7)).toBe(1);
  });
});

describe('Duplicar fica desligado como proposta (P29)', () => {
  it('todos os botões Duplicar estão desligados e apontam para o aviso', () => {
    const html = render(sample());
    const dups = html.match(/<button[^>]*>Duplicar<\/button>/g) ?? [];
    expect(dups).toHaveLength(6);
    for (const b of dups) {
      expect(b).toContain('disabled=""');
      expect(b).toContain('aria-describedby="ppages-note"');
    }
    expect(html).toContain('id="ppages-note"');
  });
});

describe('remover página pede confirmação (P34)', () => {
  it('o × só pede; a página sai depois de confirmar', () => {
    const d = sample();
    let asked: number | null = null;
    const html = renderToStaticMarkup(
      createElement(mod.PagesTab, {
        data: d,
        current: 0,
        readOnly: false,
        onSelect: () => {},
        onMove: () => {},
        onAskRemove: (i: number) => {
          asked = i;
        },
        onAdd: () => {},
      }),
    );
    // O × chama onAskRemove, não remove: quem remove é o diálogo.
    expect(html).toContain('Remover página 03');
    expect(asked).toBeNull();
    const dialog = decode(renderToStaticMarkup(createElement(mod.RemovePageDialog, { data: d, index: 2, onCancel: () => {}, onConfirm: () => {} })));
    expect(dialog).toContain('role="dialog"');
    expect(dialog).toContain('aria-modal="true"');
    expect(dialog).toContain('Remover a página 03?');
    expect(dialog).toContain('“Moodboard de materiais” sai da apresentação com tudo o que foi escrito nela.');
    expect(dialog).toContain('>Cancelar<');
    expect(dialog).toContain('>Remover página<');
    const removed = removePage(d, 2);
    expect(kinds(removed)).toEqual(['capa', 'texto', 'visual', 'tecnico', 'notas', 'direitos']);
    expect(valid(removed)).toBe(true);
  });

  it('o diálogo diz quantas imagens saem com a página; as usadas em outra página continuam', () => {
    const d = sample();
    const visual = d.paginas[3] as PresentationVisualPage;
    const withImgs = {
      ...d,
      paginas: d.paginas.map((p, i) =>
        i === 3 ? { ...visual, composicao: 'duo', imagens: [{ ...visual.imagens[0], imagem: ref(IMG(1)) }, { id: newId(), imagem: ref(IMG(2)), legenda: '' }] } : p,
      ),
    } as PresentationData;
    expect(imagesLeaving(withImgs, 3)).toBe(2);
    expect(removePageDialog(withImgs, 3).images).toContain('As 2 imagens que só aparecem nesta página saem da apresentação.');
    // A imagem 1 também na capa: só a 2 sai.
    const shared = { ...withImgs, paginas: withImgs.paginas.map((p, i) => (i === 0 ? { ...p, imagem: ref(IMG(1)) } : p)) } as PresentationData;
    expect(imagesLeaving(shared, 3)).toBe(1);
    expect(removePageDialog(shared, 3).images).toContain('A imagem que só aparece nesta página sai da apresentação.');
    expect(removePageDialog(d, 2).images).toBeNull();
  });

  it('a página atual vai para a que ficou no lugar, ou para a anterior se era a última', () => {
    expect(currentAfterRemove(3, 3, 7)).toBe(3);
    expect(currentAfterRemove(6, 6, 7)).toBe(5);
    expect(currentAfterRemove(5, 2, 7)).toBe(4);
    expect(currentAfterRemove(1, 4, 7)).toBe(1);
    expect(currentAfterRemove(0, 0, 7)).toBe(0);
  });
});

describe('adicionar página', () => {
  it('o menu tem os seis tipos na ordem de 6c-21, sem Capa e sem Prancha (P36)', () => {
    expect(ADD_PAGE_OPTIONS.map((o) => o.label)).toEqual([
      'Texto & conceito',
      'Moodboard de materiais',
      'Apresentação visual',
      'Desenho técnico',
      'Notas técnicas',
      'Direitos autorais',
    ]);
    expect(ADD_PAGE_OPTIONS.map((o) => o.tipo)).toEqual([...ADDABLE_PAGE_TYPES]);
    const html = decode(render(sample()));
    const menu = html.slice(html.indexOf('ppages__add'));
    expect(menu).not.toContain('>Capa<');
    expect(menu.toLowerCase()).not.toContain('prancha');
    expect(menu.match(/class="ppages__type"/g)).toHaveLength(6);
  });

  it('a página nova entra logo depois da atual e passa a ser a atual', () => {
    const d = sample();
    const fromCover = addPage(d, 'notas', 0, newId);
    expect(fromCover.index).toBe(1);
    expect(fromCover.data.paginas[1].tipo).toBe('notas');
    expect(fromCover.data.paginas[0].tipo).toBe('capa');
    const fromMiddle = addPage(d, 'visual', 3, newId);
    expect(fromMiddle.index).toBe(4);
    expect(kinds(fromMiddle.data)).toEqual(['capa', 'texto', 'moodboard', 'visual', 'visual', 'tecnico', 'notas', 'direitos']);
    expect(valid(fromMiddle.data)).toBe(true);
    expect(addPageHelp(0)).toBe('A nova página entra logo depois da página atual (01).');
    // Capa e prancha não entram nem chamando direto.
    expect(addPage(d, 'capa' as AddablePageKind, 0, newId).data).toBe(d);
    expect(addPage(d, 'prancha' as AddablePageKind, 0, newId).data).toBe(d);
  });

  it('no limite de 40 páginas o menu fica desligado com o motivo', () => {
    let d = sample();
    while (d.paginas.length < PRESENTATION_MAX_PAGES) d = addPage(d, 'direitos', d.paginas.length - 1, newId).data;
    expect(valid(d)).toBe(true);
    expect(addPageState(d)).toEqual({ enabled: false, reason: PAGES_LIMIT_TEXT });
    expect(addPage(d, 'texto', 3, newId).data).toBe(d);
    const html = render(d);
    expect(html.match(/class="ppages__type" disabled=""/g)).toHaveLength(6);
    expect(decode(html)).toContain(PAGES_LIMIT_TEXT);
  });
});

describe('navegação com ‹ ›', () => {
  it('anda pela ordem da lista e para nas pontas', () => {
    expect(stepPage(0, 1, 7)).toBe(1);
    expect(stepPage(6, 1, 7)).toBe(6);
    expect(stepPage(0, -1, 7)).toBe(0);
    expect(stepPage(4, -1, 7)).toBe(3);
    expect(canStep(0, -1, 7)).toBe(false);
    expect(canStep(0, 1, 7)).toBe(true);
    expect(canStep(6, 1, 7)).toBe(false);
    expect(canStep(0, 1, 1)).toBe(false);
  });

  it('depois de reordenar, › mostra a página na ordem nova', () => {
    const d = movePage(sample(), 1, 1);
    expect(d.paginas[stepPage(0, 1, d.paginas.length)].tipo).toBe('moodboard');
    expect(pageNavLabel(1, d.paginas.length)).toBe('Página 02 de 07');
  });
});
