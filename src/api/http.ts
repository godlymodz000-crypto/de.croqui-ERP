/** Erro da API com o código devolvido pelo back-end (validation, email_taken, last_admin, self...). */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}

/**
 * Tempo máximo de uma leitura. Gravações não têm limite: muitas passam pelo Google Drive, e cortar uma
 * no meio poderia fazer a pessoa repetir algo que o servidor já concluiu.
 */
export const READ_TIMEOUT_MS = 15_000;

/** fetch com tempo máximo. Estourar o tempo vira ApiError 'timeout'; ficar sem rede vira 'network'. */
export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = READ_TIMEOUT_MS): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) throw new ApiError(0, 'timeout');
    throw new ApiError(0, 'network');
  }
}

export async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
  const res = method === 'GET' ? await fetchWithTimeout(`/api${url}`, init) : await fetch(`/api${url}`, init);
  if (res.status === 401) clearCache();
  if (res.status === 204) return undefined as T;
  // O tempo máximo vale também para o corpo: cortado no meio, é timeout, e não uma resposta vazia.
  const data = await res.json().catch((err) => {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) throw new ApiError(0, 'timeout');
    return {};
  });
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'unknown', data.fields);
  return data as T;
}

// ---------- Cache em memória das leituras ----------
// Vale só nesta aba e nesta sessão: some ao recarregar, ao sair e em qualquer 401.
// Leituras iguais em andamento são compartilhadas. Gravações nunca passam pelo cache; quem grava invalida.

interface Entry {
  value?: unknown;
  at: number;
  pending?: Promise<unknown>;
}
const store = new Map<string, Entry>();

/** Devolve o valor guardado em `key` se tiver menos de `ttlMs`; senão busca com `load` (uma busca por vez). */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>, opts: { force?: boolean } = {}): Promise<T> {
  const hit = store.get(key);
  if (hit?.pending) return hit.pending as Promise<T>;
  if (!opts.force && hit && 'value' in hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  const entry: Entry = { at: 0 };
  entry.pending = load().then(
    (value) => {
      // Se alguém invalidou durante a busca, o resultado serve a quem pediu, mas não fica guardado.
      if (store.get(key) === entry) {
        entry.value = value;
        entry.at = Date.now();
        delete entry.pending;
      }
      return value;
    },
    (err) => {
      if (store.get(key) === entry) store.delete(key);
      throw err;
    },
  );
  store.set(key, entry);
  return entry.pending as Promise<T>;
}

/** Guarda um valor já conhecido, como o sino tirado da primeira página de Notificações. */
export function prime<T>(key: string, value: T) {
  if (store.get(key)?.pending) return;
  store.set(key, { value, at: Date.now() });
}

/** Esquece as chaves que começam com algum dos prefixos. */
export function invalidate(...prefixes: string[]) {
  for (const key of [...store.keys()]) if (prefixes.some((p) => key.startsWith(p))) store.delete(key);
}

export function clearCache() {
  store.clear();
}

/** Roda uma gravação e, dando certo ou não, esquece as leituras que ela pode ter mudado. */
export async function mutate<T>(write: Promise<T>, ...prefixes: string[]): Promise<T> {
  try {
    return await write;
  } finally {
    invalidate(...prefixes);
  }
}

/** Validade de cada tipo de dado no cache. */
export const TTL = {
  /** Abaixo do intervalo do sino (60 s), para a leitura periódica seguinte sempre buscar de novo. */
  notifications: 55_000,
  projects: 60_000,
  audience: 5 * 60_000,
  broadcasts: 30_000,
  /** Abaixo do intervalo da Agenda (2 min): a leitura periódica sempre busca de novo. */
  events: 60_000,
  budgets: 30_000,
};
