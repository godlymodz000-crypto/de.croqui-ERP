/** O sino lê as notificações neste intervalo, e só com a aba visível. */
export const BELL_POLL_MS = 60_000;

interface Doc {
  visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', fn: () => void): void;
  removeEventListener(type: 'visibilitychange', fn: () => void): void;
}

/**
 * Leitura periódica do sino. Com a aba oculta, o relógio para. Ao voltar, lê na hora só se a última
 * leitura tem mais de um intervalo; senão espera o que falta. Devolve a função que desliga tudo.
 */
export function startBellPolling(read: () => unknown, { doc = document as Doc, interval = BELL_POLL_MS, now = () => Date.now() } = {}) {
  let last = -Infinity;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const schedule = (delay: number) => {
    stop();
    timer = setTimeout(tick, delay);
  };
  function tick() {
    last = now();
    read();
    schedule(interval);
  }
  const onVisibility = () => {
    if (doc.visibilityState !== 'visible') return stop();
    const left = interval - (now() - last);
    if (left <= 0) tick();
    else schedule(left);
  };

  // Primeira leitura ao montar, mesmo com a aba oculta: o cabeçalho precisa da contagem.
  tick();
  if (doc.visibilityState !== 'visible') stop();
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    stop();
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
