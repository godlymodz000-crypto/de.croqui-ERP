import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import type { BoardCard } from '../../api/board';
import { createCardGesture, dropDestination, type Point } from './cardDrag';

/** Perto da borda do quadro, ele rola sozinho durante o arraste (tela de 1024). */
const EDGE = 56;
const EDGE_STEP = 14;

interface Active {
  card: BoardCard;
  el: HTMLElement;
  pointerId: number;
  offset: Point;
  last: Point;
  ghost: HTMLElement | null;
  target: string | null;
  frame: number;
}

/**
 * Arraste dos cartões com Pointer Events, só com o mouse. Começa quando o cursor anda 5 px com o
 * botão pressionado, sem espera. Uma cópia do cartão segue o cursor; a etapa sob ele é o destino.
 * Soltar fora de uma etapa, na mesma etapa ou apertar Esc cancela sem gravar.
 */
export function useCardDrag({ enabled, onDrop }: { enabled: boolean; onDrop: (card: BoardCard, stageId: string) => void }) {
  const [dragging, setDragging] = useState<BoardCard | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const gesture = useRef(createCardGesture());
  const active = useRef<Active | null>(null);
  const detach = useRef<(() => void) | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => () => finish(false), []);

  function stageAt(p: Point): string | null {
    const el = document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>('[data-stage-id]');
    return el?.dataset.stageId ?? null;
  }

  function place(a: Active) {
    if (a.ghost) a.ghost.style.transform = `translate(${a.last.x - a.offset.x}px, ${a.last.y - a.offset.y}px)`;
    const target = stageAt(a.last);
    if (target !== a.target) {
      a.target = target;
      setDropTarget(target);
    }
  }

  /** Enquanto arrasta: rola o quadro perto das bordas e confere o destino depois de rolar. */
  function tick() {
    const a = active.current;
    if (!a) return;
    const board = a.el.closest<HTMLElement>('.board');
    if (board) {
      const r = board.getBoundingClientRect();
      const dx = a.last.x < r.left + EDGE ? -EDGE_STEP : a.last.x > r.right - EDGE ? EDGE_STEP : 0;
      if (dx && board.scrollWidth > board.clientWidth) {
        board.scrollLeft += dx;
        place(a);
      }
    }
    a.frame = requestAnimationFrame(tick);
  }

  function start(a: Active) {
    const rect = a.el.getBoundingClientRect();
    const ghost = a.el.cloneNode(true) as HTMLElement;
    ghost.querySelector('.board-card__menu')?.remove();
    ghost.classList.add('board-card--ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${rect.width}px`;
    // A cópia sai da coluna: leva junto o tom da etapa.
    const style = getComputedStyle(a.el);
    for (const v of ['--card-bg', '--card-edge', '--avatar-bg']) ghost.style.setProperty(v, style.getPropertyValue(v));
    document.body.append(ghost);
    document.body.classList.add('is-card-dragging');
    window.getSelection()?.removeAllRanges();
    a.ghost = ghost;
    a.offset = { x: a.last.x - rect.left, y: a.last.y - rect.top };
    setDragging(a.card);
    place(a);
    a.frame = requestAnimationFrame(tick);
  }

  function finish(drop: boolean) {
    detach.current?.();
    detach.current = null;
    const a = active.current;
    active.current = null;
    if (!a?.ghost) return;
    cancelAnimationFrame(a.frame);
    a.ghost.remove();
    document.body.classList.remove('is-card-dragging');
    setDragging(null);
    setDropTarget(null);
    const dest = drop ? dropDestination(a.card.stageId, a.target) : null;
    if (dest) onDropRef.current(a.card, dest);
  }

  function onPointerDown(e: PointerEvent<HTMLElement>, card: BoardCard) {
    if (e.button !== 0) return;
    const p = { x: e.clientX, y: e.clientY };
    gesture.current.down(p);
    finish(false);
    // O menu do cartão é só clique; toque e caneta não arrastam; sem permissão, nada.
    const canStart = enabled && e.pointerType === 'mouse' && !(e.target as Element).closest('.board-card__menu');
    const a: Active = { card, el: e.currentTarget, pointerId: e.pointerId, offset: p, last: p, ghost: null, target: null, frame: 0 };
    active.current = a;

    const move = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== a.pointerId) return;
      a.last = { x: ev.clientX, y: ev.clientY };
      if (gesture.current.move(a.last) && canStart) start(a);
      else if (a.ghost) place(a);
    };
    // O click vem logo depois do pointerup; o setTimeout zera o gesto só depois dele. Se o botão
    // foi solto fora do cartão, não há click, e o próximo Enter no link ou no menu não herda o movimento.
    const reset = () => setTimeout(() => gesture.current.reset(), 0);
    const up = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== a.pointerId) return;
      finish(true);
      reset();
    };
    const cancel = () => {
      finish(false);
      reset();
    };
    const key = (ev: KeyboardEvent) => ev.key === 'Escape' && cancel();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', key);
    detach.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', key);
    };
  }

  /** Clique com movimento (arraste ou não) não abre nada, nem pelo link do nome. */
  function onClickCapture(e: MouseEvent) {
    if (!gesture.current.isClick()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return { dragging, dropTarget, cardProps: (card: BoardCard) => ({ onPointerDown: (e: PointerEvent<HTMLElement>) => onPointerDown(e, card), onClickCapture }) };
}
