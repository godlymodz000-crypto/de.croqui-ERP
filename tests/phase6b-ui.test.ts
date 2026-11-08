// Fase 6b, etapa E6, lado da tela: abas, contagens e ordenação da lista de apresentações (6b-01 e a lista de
// 390 de 6b-13) e o painel "Nova apresentação" (6b-02), renderizado sem navegador com react-dom/server.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Presentation } from '../src/api/presentations';
import {
  canWritePresentations,
  countByTab,
  emptyTabMessage,
  mobileSubLine,
  pagesLabel,
  sortFrom,
  subLine,
  tabFrom,
  TABS,
  visiblePresentations,
} from '../src/pages/presentations/list';

type PanelMod = typeof import('../src/pages/presentations/NewPresentationPanel');
let panel: PanelMod;

beforeAll(async () => {
  // O design system espera window.React; sem navegador, window aponta para o global.
  (globalThis as { window?: unknown }).window ??= globalThis;
  panel = await import('../src/pages/presentations/NewPresentationPanel');
});

function item(over: Partial<Presentation>): Presentation {
  return {
    id: 'a',
    number: 1,
    name: 'Apresentação Teste',
    projectId: null,
    project: null,
    clientName: null,
    pageCount: 1,
    createdBy: null,
    updatedAt: '2026-11-01T10:00:00.000Z',
    updatedBy: null,
    pdf: null,
    ...over,
  };
}

const project = { id: 'p1', name: 'Projeto Teste', clientName: 'Cliente Teste' };
const list = [
  item({ id: 'a1', number: 1, name: 'Estudo inicial', updatedAt: '2026-10-28T09:00:00.000Z', clientName: 'Cliente Avulso' }),
  item({ id: 'a2', number: 2, name: 'Proposta de ambientes', projectId: 'p1', project, clientName: 'Cliente Teste', updatedAt: '2026-11-06T18:05:00.000Z' }),
  item({ id: 'a3', number: 3, name: 'Anteprojeto', projectId: 'p1', project, clientName: 'Cliente Teste', updatedAt: '2026-11-07T10:42:00.000Z' }),
];

describe('lista de apresentações', () => {
  it('as abas são Todas, Por projeto e Sem projeto; no celular, Projetos', () => {
    expect(TABS.map((t) => t.label)).toEqual(['Todas', 'Por projeto', 'Sem projeto']);
    expect(TABS.map((t) => t.short)).toEqual(['Todas', 'Projetos', 'Sem projeto']);
  });

  it('conta cada aba', () => {
    expect(countByTab(list)).toEqual({ todas: 3, projeto: 2, 'sem-projeto': 1 });
    expect(countByTab([])).toEqual({ todas: 0, projeto: 0, 'sem-projeto': 0 });
  });

  it('filtra pela aba', () => {
    expect(visiblePresentations(list, 'sem-projeto', 'updated').map((p) => p.id)).toEqual(['a1']);
    expect(visiblePresentations(list, 'projeto', 'updated').map((p) => p.id)).toEqual(['a3', 'a2']);
  });

  it('ordena por última alteração (padrão), nome e número', () => {
    expect(visiblePresentations(list, 'todas', 'updated').map((p) => p.id)).toEqual(['a3', 'a2', 'a1']);
    expect(visiblePresentations(list, 'todas', 'name').map((p) => p.id)).toEqual(['a3', 'a1', 'a2']);
    expect(visiblePresentations(list, 'todas', 'number').map((p) => p.id)).toEqual(['a3', 'a2', 'a1']);
    // A lista original não muda.
    expect(list.map((p) => p.id)).toEqual(['a1', 'a2', 'a3']);
  });

  it('aba e ordem desconhecidas na URL voltam ao padrão', () => {
    expect(tabFrom(null)).toBe('todas');
    expect(tabFrom('outra')).toBe('todas');
    expect(tabFrom('sem-projeto')).toBe('sem-projeto');
    expect(sortFrom('qualquer')).toBe('updated');
    expect(sortFrom('name')).toBe('name');
  });

  it('linhas de texto como no desenho', () => {
    expect(subLine(list[2])).toBe('Nº 3 · 1 página');
    expect(subLine(item({ number: 4, pageCount: 3 }))).toBe('Nº 4 · 3 páginas');
    expect(pagesLabel(1)).toBe('1 página');
    expect(mobileSubLine(list[0])).toBe('Nº 1 · Cliente Avulso');
    expect(mobileSubLine(item({ number: 7 }))).toBe('Nº 7');
  });

  it('mensagem da aba vazia', () => {
    expect(emptyTabMessage('sem-projeto')).toBe('Nenhuma apresentação sem projeto.');
    expect(emptyTabMessage('projeto')).toBe('Nenhuma apresentação de projeto.');
  });

  it('só administrador e colaborador criam', () => {
    const user = (role: 'admin' | 'member' | 'viewer') => ({ id: 'u', email: 'u@decroqui.test', name: null, role });
    expect(canWritePresentations(user('admin'))).toBe(true);
    expect(canWritePresentations(user('member'))).toBe(true);
    expect(canWritePresentations(user('viewer'))).toBe(false);
    expect(canWritePresentations(null)).toBe(false);
  });
});

describe('painel Nova apresentação', () => {
  const render = () => renderToStaticMarkup(createElement(panel.NewPresentationPanel, { onClose: () => {}, onCreated: () => {} }));

  it('mostra os textos do desenho, com o nome vazio e o projeto em avulsa', () => {
    const html = render();
    expect(html).toContain('Nova apresentação');
    expect(html).toContain('A apresentação começa só com a capa, sem textos nem imagens de exemplo. Você preenche tudo no editor.');
    expect(html).toContain('Nome da apresentação · obrigatório');
    expect(html).toContain('Sem projeto (avulsa)');
    expect(html).toContain(panel.HINT_AVULSA);
    expect(html).toContain('Cancelar');
    expect(html).toContain('Criar apresentação');
    expect(html).toMatch(/<input[^>]*value=""/);
  });

  it('sem exclamação nem exemplo preenchido', () => {
    const html = render();
    expect(html).not.toContain('!');
    expect(html).not.toMatch(/placeholder="[^"]+"/);
    for (const text of [...Object.values(panel.NAME_MESSAGES), panel.HINT_AVULSA, panel.HINT_PROJETO]) expect(text).not.toContain('!');
  });

  it('mensagem do nome vazio igual ao desenho', () => {
    expect(panel.NAME_MESSAGES.required).toBe('Dê um nome à apresentação para criá-la.');
  });

  it('o projeto escolhido não promete copiar a localização', () => {
    expect(panel.HINT_PROJETO).not.toMatch(/localiza/i);
  });

  it('aberto no projeto (6b-03): projeto preenchido e travado, sem a opção avulsa', () => {
    const html = renderToStaticMarkup(
      createElement(panel.NewPresentationPanel, {
        project: { id: 'p1', name: 'Projeto Teste', clientName: 'Cliente Avulso' },
        onClose: () => {},
        onCreated: () => {},
      }),
    );
    expect(html).toContain('Projeto Teste · Cliente Avulso');
    expect(html).not.toContain('Sem projeto (avulsa)');
    // Campo fixo, sem lista para trocar de projeto.
    expect(html).not.toContain('<select');
    expect(html).toContain('budget-panel__value');
    expect(html).toContain(panel.HINT_DO_PROJETO);
    expect(panel.HINT_DO_PROJETO).toBe(`Aberto a partir do projeto. ${panel.HINT_PROJETO}`);
    expect(panel.HINT_DO_PROJETO).not.toContain('!');
  });
});

describe('página do projeto (6b-03): ordem dos botões', () => {
  const source = readFileSync(new URL('../src/pages/projects/ProjectPage.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
  const at = (text: string) => {
    const i = source.indexOf(text);
    expect(i, text).toBeGreaterThan(-1);
    return i;
  };

  it('Nova apresentação, Novo orçamento e Editar, nessa ordem, no topo', () => {
    const actions = at('className="project__actions"');
    expect(at('Nova apresentação')).toBeGreaterThan(actions);
    expect(at('Novo orçamento')).toBeGreaterThan(at('Nova apresentação'));
    expect(at('Editar\n')).toBeGreaterThan(at('Novo orçamento'));
  });

  it('Excluir projeto e Pedir exclusão saem do topo e ficam no fim da página', () => {
    const header = source.slice(at('<header className="page-header">'), at('</header>'));
    expect(header).not.toContain('Excluir projeto');
    expect(header).not.toContain('Pedir exclusão');
    const footer = at('className="project__footer"');
    expect(footer).toBeGreaterThan(at('className="project-layout"'));
    expect(at('Excluir projeto\n')).toBeGreaterThan(footer);
    expect(source.indexOf('Pedir exclusão\n', footer)).toBeGreaterThan(footer);
    // Mesmo estilo de antes, sem botão Vinho novo.
    expect(source.slice(footer, footer + 800)).toContain('className="text-button"');
    expect(source.slice(footer, footer + 800)).not.toContain('variant="primary"');
    expect(css).toMatch(/\.project__footer \{/);
  });

  it('no celular não aparece Nova apresentação', () => {
    expect(source).toMatch(/canCreatePresentation = canWritePresentations\(me\) && !isMobile/);
  });
});
