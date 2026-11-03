import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApiError, clearCache, fetchWithTimeout, READ_TIMEOUT_MS, request } from '../src/api/http';
import { LoadError, loadErrorText } from '../src/ui/LoadError';

// Tempo máximo das leituras e o "Tentar de novo". O fetch é falso: respeita o signal como o do navegador.
let inits: { url: string; init?: RequestInit }[] = [];

/** fetch que só responde quando o signal aborta (simula um servidor parado). */
function hangingFetch(url: string, init?: RequestInit) {
  inits.push({ url, init });
  return new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal!.reason));
  });
}

beforeEach(() => {
  clearCache();
  inits = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tempo máximo', () => {
  it('uma leitura parada vira ApiError timeout', async () => {
    vi.stubGlobal('fetch', hangingFetch);
    const err = await fetchWithTimeout('/api/projects', {}, 30).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('timeout');
  });

  it('sem rede vira ApiError network', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    const err = (await request('GET', '/projects').catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('network');
  });

  it('o corpo cortado pelo tempo máximo é timeout, e não uma resposta vazia', async () => {
    vi.stubGlobal('fetch', async () => {
      const res = new Response('{}', { status: 200 });
      res.json = () => Promise.reject(new DOMException('tempo', 'TimeoutError'));
      return res;
    });
    const err = (await request('GET', '/projects').catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('timeout');
  });

  it('leituras levam o tempo máximo; gravações não', async () => {
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      inits.push({ url, init });
      return new Response(init?.method === 'GET' ? '[]' : null, { status: init?.method === 'GET' ? 200 : 204 });
    });
    await request('GET', '/projects');
    await request('POST', '/projects', { name: 'a' });
    expect(inits[0].init?.signal).toBeInstanceOf(AbortSignal);
    expect(inits[1].init?.signal).toBeUndefined();
    expect(READ_TIMEOUT_MS).toBe(15_000);
  });

  it('depois de um timeout, tentar de novo busca outra vez (o erro não fica no cache)', async () => {
    const { projectsApi } = await import('../src/api/projects');
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls++;
      if (calls === 1) throw new DOMException('tempo', 'TimeoutError');
      return new Response('[{"id":"p1"}]', { status: 200 });
    });
    await expect(projectsApi.list()).rejects.toMatchObject({ code: 'timeout' });
    expect(await projectsApi.list()).toEqual([{ id: 'p1' }]);
    expect(calls).toBe(2);
  });
});

describe('Tentar de novo', () => {
  it('a mensagem diz quando o servidor estourou o tempo ou não há rede', () => {
    expect(loadErrorText(new ApiError(0, 'timeout'), 'genérica')).toBe('O ERP demorou demais para responder.');
    expect(loadErrorText(new ApiError(0, 'network'), 'genérica')).toContain('Sem conexão');
    expect(loadErrorText(new ApiError(500, 'unknown'), 'genérica')).toBe('genérica');
    expect(loadErrorText(new ApiError(503, 'db_unavailable'), 'genérica')).toBe('O banco de dados não respondeu a tempo. Tente de novo em alguns segundos.');
  });

  it('mostra a mensagem e o botão, e o botão chama onRetry', () => {
    const onRetry = vi.fn();
    const el = LoadError({ error: new ApiError(0, 'timeout'), message: 'Não foi possível carregar os projetos.', onRetry }) as ReactElement<{ children: ReactElement[] }>;
    const html = renderToStaticMarkup(createElement(LoadError, { error: new ApiError(0, 'timeout'), message: 'x', onRetry }));
    expect(html).toContain('O ERP demorou demais para responder.');
    expect(html).toContain('Tentar de novo');
    expect(html).toContain('role="alert"');
    const button = el.props.children[1] as ReactElement<{ onClick: () => void }>;
    button.props.onClick();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
