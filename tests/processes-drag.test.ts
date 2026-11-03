// Arraste e clique dos cartões em Processos: o gesto do mouse decide entre abrir o projeto e arrastar.
import { describe, expect, it } from 'vitest';
import { createCardGesture, DRAG_THRESHOLD, isCardBackground } from '../src/pages/processes/cardDrag';

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
