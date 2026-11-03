import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, clearCache, invalidate, mutate, prime, TTL } from '../src/api/http';
import { broadcastsApi, notificationsApi } from '../src/api/notifications';
import { projectsApi } from '../src/api/projects';
import { usersApi } from '../src/api/users';
import { deletionApi } from '../src/api/files';

// Cache em memória das leituras (src/api/http.ts). O fetch é falso e conta as chamadas por rota.
let calls: string[] = [];
let status = 200;

function json(body: unknown, code = status) {
  return new Response(code === 204 ? null : JSON.stringify(body), { status: code, headers: { 'content-type': 'application/json' } });
}

function notices(n: number, unread = 1) {
  const items = Array.from({ length: n }, (_, i) => ({ id: `n${i}`, type: 'announcement', title: `T${i}`, body: '', link: null, senderName: null, readAt: null, createdAt: new Date().toISOString() }));
  return { items, unread, total: n, page: 1, pageSize: 20, pendingDeletionRequests: 0 };
}

beforeEach(() => {
  clearCache();
  calls = [];
  status = 200;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const route = `${init?.method ?? 'GET'} ${url.replace(/^\/api/, '')}`;
    calls.push(route);
    if (init?.method && init.method !== 'GET') return json(undefined, status === 200 ? 204 : status);
    if (url.startsWith('/api/notifications')) return json(notices(url.includes('limit=5') ? 5 : 12));
    if (url === '/api/projects') return json([{ id: 'p1', name: 'Casa' }]);
    if (url === '/api/broadcasts/audience') return json({ people: [], counts: { all: 0, members: 0, viewers: 0 } });
    return json({});
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const count = (route: string) => calls.filter((c) => c === route).length;

describe('cached', () => {
  it('dentro da validade devolve o guardado; depois busca de novo', async () => {
    let n = 0;
    const load = async () => ++n;
    expect(await cached('k', 1000, load)).toBe(1);
    vi.advanceTimersByTime(999);
    expect(await cached('k', 1000, load)).toBe(1);
    vi.advanceTimersByTime(2);
    expect(await cached('k', 1000, load)).toBe(2);
  });

  it('leituras iguais ao mesmo tempo viram uma busca só', async () => {
    let n = 0;
    const load = () => new Promise<number>((r) => setTimeout(() => r(++n), 5));
    const [a, b] = await Promise.all([cached('k', 1000, load), cached('k', 1000, load)]);
    expect([a, b, n]).toEqual([1, 1, 1]);
  });

  it('force ignora o guardado', async () => {
    let n = 0;
    const load = async () => ++n;
    await cached('k', 1000, load);
    expect(await cached('k', 1000, load, { force: true })).toBe(2);
  });

  it('erro não fica guardado', async () => {
    let fail = true;
    const load = async () => {
      if (fail) throw new Error('rede');
      return 'ok';
    };
    await expect(cached('k', 1000, load)).rejects.toThrow('rede');
    fail = false;
    expect(await cached('k', 1000, load)).toBe('ok');
  });

  it('invalidar durante a busca: quem pediu recebe, mas o valor não fica guardado', async () => {
    let n = 0;
    let release!: () => void;
    const slow = () => new Promise<number>((r) => (release = () => r(++n)));
    const p = cached('notifications', 1000, slow);
    invalidate('notifications');
    release();
    expect(await p).toBe(1);
    expect(await cached('notifications', 1000, async () => ++n)).toBe(2);
  });

  it('invalidate esquece só os prefixos pedidos', async () => {
    prime('notifications?limit=5', 'a');
    prime('projects', 'b');
    invalidate('notifications');
    expect(await cached('notifications?limit=5', 1000, async () => 'novo')).toBe('novo');
    expect(await cached('projects', 1000, async () => 'novo')).toBe('b');
  });

  it('mutate invalida mesmo quando a gravação falha', async () => {
    prime('projects', 'velho');
    await expect(mutate(Promise.reject(new Error('x')), 'projects')).rejects.toThrow('x');
    expect(await cached('projects', 1000, async () => 'novo')).toBe('novo');
  });

  it('um 401 limpa todo o cache', async () => {
    prime('projects', 'velho');
    status = 401;
    await expect(projectsApi.get('p1')).rejects.toThrow();
    status = 200;
    expect(await cached('projects', 1000, async () => 'novo')).toBe('novo');
  });
});

describe('dados do ERP', () => {
  it('a lista de projetos é compartilhada por 60 s entre Projetos e o painel de comunicado', async () => {
    await projectsApi.list();
    await projectsApi.list();
    expect(count('GET /projects')).toBe(1);
    vi.advanceTimersByTime(TTL.projects + 1);
    await projectsApi.list();
    expect(count('GET /projects')).toBe(2);
  });

  it('criar, editar ou excluir projeto esquece a lista', async () => {
    for (const write of [() => projectsApi.create({ name: 'a', clientName: 'b', deadline: null }), () => projectsApi.update('p1', { name: 'c' }), () => projectsApi.remove('p1')]) {
      await projectsApi.list();
      const before = count('GET /projects');
      await write();
      await projectsApi.list();
      expect(count('GET /projects')).toBe(before + 1);
    }
  });

  it('aprovar pedido de exclusão esquece projetos e notificações', async () => {
    await projectsApi.list();
    await notificationsApi.list({ limit: 5 });
    await deletionApi.approve('r1');
    await projectsApi.list();
    await notificationsApi.list({ limit: 5 });
    expect(count('GET /projects')).toBe(2);
    expect(count('GET /notifications?limit=5')).toBe(2);
  });

  it('a primeira página de Todas abastece o sino', async () => {
    const page = await notificationsApi.list();
    const bell = await notificationsApi.list({ limit: 5 });
    expect(count('GET /notifications')).toBe(1);
    expect(count('GET /notifications?limit=5')).toBe(0);
    expect(bell.items).toHaveLength(5);
    expect(bell.unread).toBe(page.unread);
  });

  it('a consulta do sino a cada 30 s sempre busca de novo (validade de 25 s)', async () => {
    await notificationsApi.list({ limit: 5 });
    vi.advanceTimersByTime(30_000);
    await notificationsApi.list({ limit: 5 });
    expect(count('GET /notifications?limit=5')).toBe(2);
  });

  it('marcar como lida, marcar todas e enviar comunicado esquecem as notificações', async () => {
    for (const write of [() => notificationsApi.read('n1'), () => notificationsApi.readAll(), () => broadcastsApi.send({ audience: 'all', title: 't', body: 'b', link: null })]) {
      await notificationsApi.list({ limit: 5 });
      const before = count('GET /notifications?limit=5');
      await write();
      await notificationsApi.list({ limit: 5 });
      expect(count('GET /notifications?limit=5')).toBe(before + 1);
    }
  });

  it('enviar comunicado esquece a lista de enviados, não a de destinatários', async () => {
    await broadcastsApi.list();
    await broadcastsApi.audience();
    await broadcastsApi.send({ audience: 'all', title: 't', body: 'b', link: null });
    await broadcastsApi.list();
    await broadcastsApi.audience();
    expect(count('GET /broadcasts')).toBe(2);
    expect(count('GET /broadcasts/audience')).toBe(1);
  });

  it('destinatários valem 5 min e mudanças em colaboradores os esquecem', async () => {
    await broadcastsApi.audience();
    vi.advanceTimersByTime(4 * 60_000);
    await broadcastsApi.audience();
    expect(count('GET /broadcasts/audience')).toBe(1);
    await usersApi.changeRole('u1', 'viewer');
    await broadcastsApi.audience();
    expect(count('GET /broadcasts/audience')).toBe(2);
    vi.advanceTimersByTime(TTL.audience + 1);
    await broadcastsApi.audience();
    expect(count('GET /broadcasts/audience')).toBe(3);
  });
});
