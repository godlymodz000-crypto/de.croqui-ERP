import { beforeAll, describe, expect, it } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Notification } from '../src/api/notifications';

// Renderização do sino, da lista de notificações e da tela de recuperação, sem navegador:
// react-dom/server gera o HTML. O design system espera window.React, então window aponta para o global.
type Mods = {
  bell: typeof import('../src/layout/NotificationBell');
  page: typeof import('../src/pages/notifications/NotificationsPage');
  boundary: typeof import('../src/ui/ErrorBoundary');
  api: typeof import('../src/api/notifications');
};
let m: Mods;

beforeAll(async () => {
  (globalThis as { window?: unknown }).window ??= globalThis;
  m = {
    bell: await import('../src/layout/NotificationBell'),
    page: await import('../src/pages/notifications/NotificationsPage'),
    boundary: await import('../src/ui/ErrorBoundary'),
    api: await import('../src/api/notifications'),
  };
});

const html = (el: ReactElement) => renderToStaticMarkup(el);
const noop = () => {};

function notice(over: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'announcement',
    title: 'Teste de renderização, pode ignorar',
    body: 'Texto do comunicado.',
    link: null,
    senderName: 'Kelly',
    readAt: null,
    createdAt: new Date().toISOString(),
    ...over,
  };
}

const TYPES = ['deletion.requested', 'deletion.approved', 'deletion.rejected', 'drive.failed', 'announcement'] as const;

describe('cada tipo de notificação renderiza', () => {
  for (const type of TYPES) {
    it(`${type} no sino e na página`, () => {
      const n = notice({ type, title: `Título ${type}` });
      const label = m.api.TYPE_LABEL[type];
      expect(label).toBeTruthy();
      expect(html(createElement(m.bell.BellItem, { n, onOpen: noop }))).toContain(`Título ${type}`);
      const row = html(createElement(m.page.NoticeRow, { n, onOpen: noop }));
      expect(row).toContain(`Título ${type}`);
      expect(row).toContain(`>${label}<`);
    });
  }

  it('um tipo que a interface não conhece aparece como Aviso', () => {
    const n = notice({ type: 'algo.novo' as Notification['type'] });
    expect(m.api.typeLabel('algo.novo')).toBe('Aviso');
    expect(html(createElement(m.page.NoticeRow, { n, onOpen: noop }))).toContain('>Aviso<');
    expect(html(createElement(m.bell.BellItem, { n, onOpen: noop }))).toContain('Teste de renderização');
  });
});

describe('campos nulos não quebram a renderização', () => {
  const cases: [string, Partial<Notification>][] = [
    ['link nulo', { link: null }],
    ['texto nulo', { body: null as unknown as string }],
    ['título nulo', { title: null as unknown as string }],
    ['data nula', { createdAt: null as unknown as string }],
    ['data inválida', { createdAt: 'não é data' }],
    ['tipo nulo', { type: null as unknown as Notification['type'] }],
    ['remetente nulo', { senderName: null }],
  ];
  for (const [label, over] of cases) {
    it(label, () => {
      const n = notice(over);
      expect(() => html(createElement(m.bell.BellItem, { n, onOpen: noop }))).not.toThrow();
      expect(() => html(createElement(m.page.NoticeRow, { n, onOpen: noop }))).not.toThrow();
    });
  }

  it('sem título, mostra o tipo no lugar', () => {
    const n = notice({ title: null as unknown as string, type: 'drive.failed' });
    expect(html(createElement(m.bell.BellItem, { n, onOpen: noop }))).toContain('Drive');
  });

  it('data nula ou inválida fica vazia, e não "NaN"', () => {
    expect(m.bell.when(null)).toBe('');
    expect(m.bell.when('não é data')).toBe('');
    expect(html(createElement(m.page.NoticeRow, { n: notice({ createdAt: 'x' }), onOpen: noop }))).not.toContain('NaN');
  });
});

describe('tela de recuperação', () => {
  it('um erro forçado troca o conteúdo pela tela de recuperação', () => {
    const { ErrorBoundary, RecoveryScreen } = m.boundary;
    const props = { fallback: (e: Error) => createElement(RecoveryScreen, { error: e }), children: createElement('p', null, 'conteúdo') };
    const boundary = new ErrorBoundary(props);
    expect(html(boundary.render() as ReactElement)).toContain('conteúdo');

    boundary.state = ErrorBoundary.getDerivedStateFromError(new Error('Falha forçada no sino'));
    const out = html(boundary.render() as ReactElement);
    expect(out).toContain('Algo deu errado');
    expect(out).toContain('Voltar ao início');
    expect(out).toContain('Falha forçada no sino');
    expect(out).not.toContain('conteúdo');
  });

  it('algo que não é Error também vira mensagem legível', () => {
    const state = m.boundary.ErrorBoundary.getDerivedStateFromError('texto solto');
    expect(state.error).toBeInstanceOf(Error);
    expect(state.error.message).toBe('texto solto');
  });

  it('trocar de rota (resetKey) limpa o erro e tenta de novo', () => {
    const { ErrorBoundary } = m.boundary;
    const fallback = () => createElement('p', null, 'recuperação');
    const b = new ErrorBoundary({ fallback, resetKey: '/notificacoes', children: null });
    b.state = { error: new Error('x') };
    let next: unknown = null;
    b.setState = ((s: unknown) => (next = s)) as typeof b.setState;
    (b as { props: unknown }).props = { fallback, resetKey: '/projetos', children: null };
    b.componentDidUpdate({ fallback, resetKey: '/notificacoes', children: null });
    expect(next).toEqual({ error: null });
  });

  it('o fallback do sino mantém o link para a página de Notificações', async () => {
    const { MemoryRouter } = await import('react-router');
    const out = html(createElement(MemoryRouter, null, createElement(m.bell.BellFallback)));
    expect(out).toContain('href="/notificacoes"');
    expect(out).toContain('aria-label="Notificações"');
  });
});
