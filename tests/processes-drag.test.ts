// Arraste e clique dos cartões em Processos: o gesto do mouse decide entre abrir o projeto e arrastar.
import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../src/session';

// O design system pede um window global ao ser importado (ver phase4-ui.test.ts).
(globalThis as { window?: unknown }).window ??= globalThis;
const { canDragCards, createCardGesture, dropDestination, DRAG_THRESHOLD, isCardBackground } = await import('../src/pages/processes/cardDrag');

const user = (role: SessionUser['role']) => ({ id: 'u1', email: 'a@decroqui.test', name: 'A', role }) as SessionUser;

/** Alvo de clique falso: `closest` responde pelo que estiver em `inside`. */
const target = (...inside: string[]) => ({ closest: (sel: string) => (sel.split(', ').some((s) => inside.includes(s)) ? {} : null) });

describe('clique no cartão', () => {
  it('o limite é de 5 px', () => {
    expect(DRAG_THRESHOLD).toBe(5);
  });

  it('clique simples abre o projeto', () => {
    const g = createCardGesture();
    g.down({ x: 100, y: 100 });
    expect(g.isClick()).toBe(true);
  });

  it('tremer menos de 5 px ainda é clique', () => {
    const g = createCardGesture();
    g.down({ x: 100, y: 100 });
    expect(g.move({ x: 103, y: 102 })).toBe(false);
    expect(g.isClick()).toBe(true);
  });

  it('clique com movimento de 5 px ou mais não abre', () => {
    const g = createCardGesture();
    g.down({ x: 100, y: 100 });
    expect(g.move({ x: 105, y: 100 })).toBe(true);
    expect(g.move({ x: 140, y: 100 })).toBe(false); // avisa só uma vez
    expect(g.isClick()).toBe(false);
    // O gesto seguinte começa do zero.
    g.down({ x: 10, y: 10 });
    expect(g.isClick()).toBe(true);
  });

  it('Enter no link do nome, sem pointerdown, continua abrindo', () => {
    expect(createCardGesture().isClick()).toBe(true);
  });

  it('o fundo do cartão abre; o link e o menu têm ação própria', () => {
    expect(isCardBackground(target())).toBe(true);
    expect(isCardBackground(target('a'))).toBe(false);
    expect(isCardBackground(target('button'))).toBe(false);
    expect(isCardBackground(target('[role="menuitem"]'))).toBe(false);
    expect(isCardBackground(null)).toBe(false);
  });
});

describe('arraste com o mouse', () => {
  it('só começa depois de 5 px, sem espera', () => {
    const g = createCardGesture();
    g.down({ x: 0, y: 0 });
    expect(g.move({ x: 4, y: 0 })).toBe(false);
    expect(g.move({ x: 3, y: 4 })).toBe(true); // 5 px na diagonal
  });

  it('sem projects.move ou no celular, o arraste não começa', () => {
    expect(canDragCards(user('admin'), false)).toBe(true);
    expect(canDragCards(user('member'), false)).toBe(true);
    expect(canDragCards(user('viewer'), false)).toBe(false);
    expect(canDragCards(null, false)).toBe(false);
    expect(canDragCards(user('admin'), true)).toBe(false);
  });

  it('soltar na mesma etapa ou fora do quadro não move', () => {
    expect(dropDestination('s1', 's1')).toBeNull();
    expect(dropDestination('s1', null)).toBeNull();
    expect(dropDestination('s1', 's2')).toBe('s2');
  });
});
