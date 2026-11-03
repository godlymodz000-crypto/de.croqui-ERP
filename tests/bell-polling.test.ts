// Sino: uma leitura a cada 60 s, só com a aba visível; ao voltar para a aba, só lê se a última passou de 60 s.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BELL_POLL_MS, startBellPolling } from '../src/layout/bellPolling';

function fakeDoc(state: DocumentVisibilityState = 'visible') {
  const listeners = new Set<() => void>();
  return {
    visibilityState: state,
    addEventListener: (_: 'visibilitychange', fn: () => void) => listeners.add(fn),
    removeEventListener: (_: 'visibilitychange', fn: () => void) => listeners.delete(fn),
    set(next: DocumentVisibilityState) {
      this.visibilityState = next;
      listeners.forEach((fn) => fn());
    },
    listeners,
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('leitura periódica do sino', () => {
  it('lê ao montar e depois a cada 60 s', () => {
    const read = vi.fn();
    const stop = startBellPolling(read, { doc: fakeDoc(), now: () => Date.now() });
    expect(read).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(BELL_POLL_MS - 1);
    expect(read).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(read).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(BELL_POLL_MS * 3);
    expect(read).toHaveBeenCalledTimes(5);
    stop();
  });

  it('com a aba oculta, para de ler', () => {
    const read = vi.fn();
    const doc = fakeDoc();
    const stop = startBellPolling(read, { doc, now: () => Date.now() });
    doc.set('hidden');
    vi.advanceTimersByTime(BELL_POLL_MS * 10);
    expect(read).toHaveBeenCalledTimes(1);
    stop();
  });

  it('ao voltar antes de 60 s, não lê na hora; espera só o que falta', () => {
    const read = vi.fn();
    const doc = fakeDoc();
    const stop = startBellPolling(read, { doc, now: () => Date.now() });
    vi.advanceTimersByTime(20_000);
    doc.set('hidden');
    vi.advanceTimersByTime(10_000);
    doc.set('visible');
    expect(read).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(BELL_POLL_MS - 30_000 - 1);
    expect(read).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(read).toHaveBeenCalledTimes(2);
    stop();
  });

  it('ao voltar depois de mais de 60 s, lê na hora', () => {
    const read = vi.fn();
    const doc = fakeDoc();
    const stop = startBellPolling(read, { doc, now: () => Date.now() });
    doc.set('hidden');
    vi.advanceTimersByTime(5 * 60_000);
    expect(read).toHaveBeenCalledTimes(1);
    doc.set('visible');
    expect(read).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(BELL_POLL_MS);
    expect(read).toHaveBeenCalledTimes(3);
    stop();
  });

  it('montado com a aba oculta, lê uma vez para a contagem e espera a aba aparecer', () => {
    const read = vi.fn();
    const doc = fakeDoc('hidden');
    const stop = startBellPolling(read, { doc, now: () => Date.now() });
    vi.advanceTimersByTime(BELL_POLL_MS * 5);
    expect(read).toHaveBeenCalledTimes(1);
    doc.set('visible');
    expect(read).toHaveBeenCalledTimes(2);
    stop();
  });

  it('ao desmontar, para o relógio e tira o listener', () => {
    const read = vi.fn();
    const doc = fakeDoc();
    const stop = startBellPolling(read, { doc, now: () => Date.now() });
    stop();
    vi.advanceTimersByTime(BELL_POLL_MS * 5);
    expect(read).toHaveBeenCalledTimes(1);
    expect(doc.listeners.size).toBe(0);
  });
});
