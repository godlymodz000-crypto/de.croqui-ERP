import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Icon, Toast } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { useSession } from '../../session';
import { useNotifications, when } from '../../layout/NotificationBell';
import {
  broadcastsApi,
  notificationsApi,
  PAGE_SIZE,
  typeLabel,
  type Audience,
  type Notification,
  type NotificationsState,
  type SentBroadcast,
  type TypeFilter,
  type View,
} from '../../api/notifications';
import { BroadcastPanel } from './BroadcastPanel';

type Tab = View | 'sent';

const GENERIC_ERROR = 'Não foi possível carregar. Tente de novo em instantes.';

const AUDIENCE_LABEL: Record<Exclude<Audience, 'people'>, string> = {
  all: 'Todos os usuários ativos',
  members: 'Só colaboradores',
  viewers: 'Só leitores',
};

/** "João Ventura e Luísa Mendes", "Ana, Bia e Caio". */
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '—';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** Rodapé da lista: "1 a 20 de 46 · página 1 de 3", com Anterior e Próxima. */
function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const isMobile = useIsMobile();
  if (!total) return null;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  return (
    <nav className="pagination" aria-label="Páginas">
      <span className="pagination__count">
        {from} a {to} de {total}
        {!isMobile && ` · página ${page} de ${pages}`}
      </span>
      <span className="pagination__nav">
        <button type="button" className="text-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </button>
        <button type="button" className="text-button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Próxima
        </button>
      </span>
    </nav>
  );
}

/** Uma linha da lista. Tipo desconhecido, título, texto, data ou link ausentes não quebram a página. */
export function NoticeRow({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  const label = typeLabel(n.type);
  const date = when(n.createdAt);
  return (
    <button type="button" className={`notice-row${n.readAt ? '' : ' is-unread'}`} onClick={() => onOpen(n)}>
      <span className="notification__mark" aria-hidden />
      <span className="notice-row__text">
        <span className="notice-row__title">
          {n.title || label}
          {!n.readAt && <span className="visually-hidden"> (não lida)</span>}
        </span>
        {n.body && <span className="notice-row__body">{n.body}</span>}
        <span className="notice-row__meta">{date ? `${label} · ${date}` : label}</span>
      </span>
      <span className="notice-row__type">{label}</span>
      <span className="notice-row__when">{date}</span>
      <span className="notice-row__open">
        {n.link && (
          <span className="arrow-link">
            Abrir
            <AppIcon name="arrow-right" size={14} />
          </span>
        )}
      </span>
    </button>
  );
}

/** Central de notificações (quadros "ERP · Notificações · página · 1440" e "· 390"). Abre na aba Todas. */
export function NotificationsPage() {
  const session = useSession();
  const isAdmin = session.status === 'authenticated' && session.user.role === 'admin';
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { state: bell, refresh: refreshBell } = useNotifications();

  const [tab, setTab] = useState<Tab>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationsState | null>(null);
  const [sent, setSent] = useState<{ items: SentBroadcast[]; total: number } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [composing, setComposing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (tab === 'sent') setSent(await broadcastsApi.list(page));
      else setData(await notificationsApi.list({ view: tab, type, page }));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, [tab, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Chegou notificação nova pelo sino (a cada 30 segundos): a lista acompanha.
  const bellUnread = bell?.unread;
  useEffect(() => {
    if (tab !== 'sent' && bellUnread !== undefined && data && bellUnread !== data.unread) load();
  }, [bellUnread]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  function choose(next: Tab) {
    setTab(next);
    setPage(1);
  }

  async function open(n: Notification) {
    if (!n.readAt) {
      // Marca na tela na hora; o sino e a contagem acompanham logo em seguida.
      setData((d) => d && { ...d, unread: Math.max(0, d.unread - 1), items: d.items.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)) });
      await notificationsApi.read(n.id).catch(() => {});
      refreshBell();
      if (tab === 'unread' && !n.link) load();
    }
    if (n.link) navigate(n.link);
  }

  async function markAll() {
    await notificationsApi.readAll().catch(() => {});
    refreshBell();
    load();
  }

  const unread = data?.unread ?? bell?.unread ?? 0;
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'requests', label: 'Pedidos' },
    { value: 'announcements', label: 'Comunicados' },
    ...(isAdmin ? [{ value: 'drive' as const, label: 'Drive' }] : []),
  ];
  const items = data?.items ?? [];

  return (
    <section className="notifications-page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Central</p>
          <h1 className="page-header__title">Notificações</h1>
          <p className="page-header__intro">Avisos do ERP para você, do mais recente ao mais antigo.</p>
        </div>
        {isAdmin && (
          <Button variant="primary" iconLeft="plus" onClick={() => setComposing(true)}>
            Novo comunicado
          </Button>
        )}
      </header>

      <div className="tabs" role="tablist" aria-label="Notificações">
        <button type="button" role="tab" aria-selected={tab === 'unread'} className="tabs__tab" onClick={() => choose('unread')}>
          Não lidas{unread > 0 && ` · ${unread}`}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'all'} className="tabs__tab" onClick={() => choose('all')}>
          Todas
        </button>
        {isAdmin && (
          <button type="button" role="tab" aria-selected={tab === 'sent'} className="tabs__tab" onClick={() => choose('sent')}>
            {isMobile ? 'Enviados' : 'Comunicados enviados'}
          </button>
        )}
      </div>

      {tab !== 'sent' && (
        <div className="notifications-toolbar">
          <label className="filter-chip">
            <span className="filter-chip__label">Tipo</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TypeFilter);
                setPage(1);
              }}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="filter-chip__chevron" aria-hidden>
              <Icon name="chevron-down" size={16} />
            </span>
          </label>
          {unread > 0 &&
            (isMobile ? (
              <button type="button" className="text-button notifications-toolbar__all" onClick={markAll}>
                Marcar todas como lidas
              </button>
            ) : (
              <Button variant="outline" size="sm" onClick={markAll}>
                Marcar todas como lidas
              </Button>
            ))}
        </div>
      )}

      {tab !== 'sent' ? (
        <div className="notice-table">
          <div className="notice-table__head" aria-hidden>
            <span>Notificação</span>
            <span>Tipo</span>
            <span>Data</span>
            <span />
          </div>
          {loadFailed && <p className="people-table__message">{GENERIC_ERROR}</p>}
          {data && !loadFailed && items.length === 0 && (
            <div className="notice-table__empty">
              {type !== 'all' ? (
                <p>Nenhuma notificação deste tipo{tab === 'unread' ? ' para ler' : ''}.</p>
              ) : (
                <>
                  <p>Nenhuma notificação por enquanto.</p>
                  <p>
                    {isAdmin
                      ? 'Pedidos de exclusão, comunicados e falhas no Google Drive aparecem aqui.'
                      : 'Comunicados do estúdio e respostas aos seus pedidos de exclusão aparecem aqui.'}
                    {tab === 'unread' && ' As já lidas ficam em Todas.'}
                  </p>
                </>
              )}
            </div>
          )}
          <ul className="notice-table__list" aria-label="Notificações">
          {items.map((n) => (
            <li key={n.id}>
              <NoticeRow n={n} onOpen={open} />
            </li>
          ))}
          </ul>
          <Pagination page={page} total={data?.total ?? 0} onPage={setPage} />
        </div>
      ) : (
        <div className="sent-table" role="table" aria-label="Comunicados enviados">
          <div className="sent-table__head" role="row">
            <span role="columnheader">Comunicado</span>
            <span role="columnheader">Destinatários</span>
            <span role="columnheader">Enviado em</span>
            <span role="columnheader">Leram</span>
          </div>
          {loadFailed && <p className="people-table__message">{GENERIC_ERROR}</p>}
          {sent && !loadFailed && sent.items.length === 0 && (
            <div className="notice-table__empty">
              <p>Nenhum comunicado enviado.</p>
              <p>Use Novo comunicado para avisar o estúdio dentro do ERP.</p>
            </div>
          )}
          {sent?.items.map((b) => (
            <div key={b.id} role="row" className="sent-table__row">
              <span role="cell" className="notice-row__text">
                <span className="notice-row__title">{b.title}</span>
                <span className="notice-row__body">{b.body}</span>
              </span>
              <span role="cell" className="sent-table__audience" data-label="Para">
                {b.audience === 'people' ? joinNames(b.recipients ?? []) : AUDIENCE_LABEL[b.audience]}
              </span>
              <span role="cell" className="notice-row__when" data-label="Enviado">
                {when(b.createdAt)}
              </span>
              <span role="cell" className="sent-table__read" data-label="Leram">
                {b.readCount} de {b.recipientCount}
              </span>
            </div>
          ))}
          <Pagination page={page} total={sent?.total ?? 0} onPage={setPage} />
        </div>
      )}

      {composing && (
        <BroadcastPanel
          onClose={() => setComposing(false)}
          onSent={(count) => {
            setComposing(false);
            setToast(`Comunicado enviado para ${count} ${count === 1 ? 'pessoa' : 'pessoas'}.`);
            refreshBell();
            if (tab === 'sent' && page === 1) load();
            else choose('sent');
          }}
        />
      )}

      {toast && (
        <div className="toast-slot">
          <Toast tone="neutral" message={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </section>
  );
}
