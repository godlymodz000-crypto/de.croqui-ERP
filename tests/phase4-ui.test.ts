// Fase 4, lado da tela: ordem dos cartões igual à do servidor, prazo e iniciais do cartão,
// movimento local e o cache do quadro (uma leitura; mover não busca de novo; erro volta a buscar).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compareCards as serverCompare } from '../api/_app/routes/stages.js';
import { clearCache } from '../src/api/http';
import { boardApi, compareCards, withCardIn, type Board } from '../src/api/board';
import { cardDeadline, initials, projectList, shortDate, todayIso } from '../src/pages/processes/cards';

const board: Board = {
  stages: [
    { id: 's1', name: 'Briefing', position: 1 },
    { id: 's2', name: 'Projeto', position: 2 },
  ],
  projects: [
    { id: 'p1', name: 'Casa Loureiro', clientName: 'Família Toledo', stageId: 's1', deadline: '2026-11-03', owner: 'Marina Costa' },
    { id: 'p2', name: 'Sítio Itaipava', clientName: 'Otávio Reis', stageId: 's1', deadline: '2026-10-29', owner: null },
    { id: 'p3', name: 'Casa Alecrim', clientName: 'Helena Prado', stageId: 's2', deadline: null, owner: 'joao@decroqui.test' },
  ],
};

describe('cartões', () => {
  it('a tela ordena os cartões como o servidor', () => {
    const cards = [
      { name: 'Beta', deadline: null },
      { name: 'Ária', deadline: '2026-11-05' },
      { name: 'Casa', deadline: '2026-11-01' },
      { name: 'Alfa', deadline: '2026-11-05' },
      { name: 'Zeta', deadline: null },
    ];
    expect([...cards].sort(compareCards)).toEqual([...cards].sort(serverCompare));
    expect([...cards].sort(compareCards).map((c) => c.name)).toEqual(['Casa', 'Alfa', 'Ária', 'Beta', 'Zeta']);
  });

  it('mover localmente troca só a etapa do cartão e mantém a ordem por prazo', () => {
    const next = withCardIn(board, 'p3', 's1');
    expect(next.projects.filter((p) => p.stageId === 's1').map((p) => p.name)).toEqual(['Sítio Itaipava', 'Casa Loureiro', 'Casa Alecrim']);
    expect(board.projects.find((p) => p.id === 'p3')?.stageId).toBe('s2');
  });

  it('prazo: hoje ainda não está atrasado; ontem está', () => {
    expect(cardDeadline('2026-11-03', '2026-11-03')).toEqual({ text: 'Prazo 3 nov', overdue: false });
    expect(cardDeadline('2026-10-29', '2026-11-03')).toEqual({ text: 'Atrasado · 29 out', overdue: true });
    expect(cardDeadline(null)).toBeNull();
    expect(shortDate('2026-12-02')).toBe('2 dez');
    expect(todayIso(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });

  it('iniciais e lista de projetos no texto da remoção', () => {
    expect(initials('Joana Maria Vieira')).toBe('JV');
    expect(initials('joao@decroqui.test')).toBe('JO');
    expect(initials(null)).toBe('');
    expect(projectList(['A'])).toBe('A');
    expect(projectList(['A', 'B', 'C'])).toBe('A, B e C');
    expect(projectList(['A', 'B', 'C', 'D'])).toBe('Os 4 projetos');
  });
});

describe('menu "Mover para"', () => {
  beforeAll(() => {
    (globalThis as { window?: unknown }).window ??= globalThis;
  });

  it('mostra o título do grupo e marca a etapa atual sem ação', async () => {
    const { RowMenuItems } = await import('../src/pages/collaborators/RowMenu');
    const picked = vi.fn();
    const html = renderToStaticMarkup(
      createElement(RowMenuItems, {
        onPicked: picked,
        actions: [
          { label: 'Abrir projeto', onSelect: () => {} },
          { heading: 'Mover para' },
          { label: 'Briefing · etapa atual', disabled: true, onSelect: () => {} },
          { label: 'Projeto', onSelect: () => {} },
        ],
      }),
    );
    expect(html).toContain('<p class="row-menu__heading" role="presentation">Mover para</p>');
    expect(html).toMatch(/aria-disabled="true"[^>]*>Briefing · etapa atual/);
    expect(html).not.toMatch(/aria-disabled="true"[^>]*>Projeto</);
    expect(html.match(/role="menuitem"/g)).toHaveLength(3);
  });
});

describe('cache do quadro', () => {
  let calls: { method: string; url: string }[] = [];
  let failMove = false;

  beforeEach(() => {
    clearCache();
    calls = [];
    failMove = false;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ method, url });
      if (method === 'PATCH') {
        if (failMove) return new Response('{"error":"unknown"}', { status: 500 });
        const { stageId } = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ id: 'p3', stageId }), { status: 200 });
      }
      return new Response(JSON.stringify(board), { status: 200 });
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  const reads = () => calls.filter((c) => c.method === 'GET' && c.url === '/api/board').length;

  it('uma leitura traz o quadro; a segunda visita usa o cache', async () => {
    await boardApi.get();
    await boardApi.get();
    expect(reads()).toBe(1);
  });

  it('mover não busca o quadro de novo, e o quadro guardado já vem com o movimento', async () => {
    const first = await boardApi.get();
    const moved = withCardIn(first, 'p3', 's1');
    await boardApi.move('p3', 's1');
    boardApi.remember(moved);
    const again = await boardApi.get();
    expect(reads()).toBe(1);
    expect(again.projects.find((p) => p.id === 'p3')?.stageId).toBe('s1');
    expect(calls.filter((c) => c.method === 'PATCH')).toEqual([{ method: 'PATCH', url: '/api/projects/p3/stage' }]);
  });

  it('erro ao mover: a tela pede o quadro de novo ao servidor', async () => {
    await boardApi.get();
    failMove = true;
    await expect(boardApi.move('p3', 's1')).rejects.toMatchObject({ status: 500 });
    await boardApi.get({ force: true });
    expect(reads()).toBe(2);
  });

  it('gravar projeto ou etapa esquece o quadro guardado', async () => {
    const { projectsApi } = await import('../src/api/projects');
    await boardApi.get();
    await projectsApi.update('p1', { name: 'Outro' }).catch(() => {});
    await boardApi.get();
    await boardApi.renameStage('s1', 'Início').catch(() => {});
    await boardApi.get();
    expect(reads()).toBe(3);
  });
});
