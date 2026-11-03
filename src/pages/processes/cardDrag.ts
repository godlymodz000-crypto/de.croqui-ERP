import type { SessionUser } from '../../session';
import { canWriteProjects } from '../projects/shared';

/** Quanto o cursor anda, com o botão pressionado, para o gesto deixar de ser clique. */
export const DRAG_THRESHOLD = 5;

export interface Point {
  x: number;
  y: number;
}

/**
 * Gesto do mouse sobre um cartão, do pointerdown ao click. Até andar DRAG_THRESHOLD px
 * é clique e abre o projeto; depois disso não abre.
 */
export function createCardGesture() {
  let origin: Point | null = null;
  let moved = false;
  return {
    down(p: Point) {
      origin = p;
      moved = false;
    },
    /** true na primeira vez que o gesto passa do limite. */
    move(p: Point): boolean {
      if (!origin || moved) return false;
      if (Math.hypot(p.x - origin.x, p.y - origin.y) < DRAG_THRESHOLD) return false;
      moved = true;
      return true;
    },
    /** Esquece o gesto. Chamado depois do click, para um clique sem pointerdown (teclado) não herdar o movimento. */
    reset() {
      origin = null;
      moved = false;
    },
    /** No click: true se foi clique simples. Sem pointerdown (Enter no link), também é clique. Fecha o gesto. */
    isClick(): boolean {
      const click = !moved;
      origin = null;
      moved = false;
      return click;
    },
  };
}

/** Elementos do cartão que têm ação própria: o link do nome e o menu. Clicar neles não passa pelo cartão. */
const OWN_ACTION = 'a, button, [role="menu"], [role="menuitem"]';

/** O clique caiu no fundo do cartão (e não no link nem no menu)? */
export function isCardBackground(target: { closest(selector: string): unknown } | null): boolean {
  return !!target && !target.closest(OWN_ACTION);
}

/** Arrastar é só no computador e para quem tem projects.move; no celular fica o "Mover para". */
export function canDragCards(user: SessionUser | null, isMobile: boolean): boolean {
  return canWriteProjects(user) && !isMobile;
}

/** Para onde o cartão vai ao soltar. Fora de uma etapa, ou na mesma, não vai a lugar nenhum. */
export function dropDestination(fromStageId: string, targetStageId: string | null): string | null {
  return targetStageId && targetStageId !== fromStageId ? targetStageId : null;
}
