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
