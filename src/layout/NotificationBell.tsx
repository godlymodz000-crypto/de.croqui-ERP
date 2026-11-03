import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { AppIcon } from '../ui/AppIcon';
import { BELL_SIZE, notificationsApi, typeLabel, type Notification, type NotificationsState } from '../api/notifications';
import { formatLastAccess } from '../pages/collaborators/format';
import { startBellPolling } from './bellPolling';

interface NotificationsContextValue {
  state: NotificationsState | null;
  refresh: () => Promise<void>;
  markRead: (n: Notification) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Estado das notificações do usuário conectado, compartilhado pelo sino e pelo menu do avatar. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotificationsState | null>(null);

  const refresh = useCallback(async () => {
    try {
      setState(await notificationsApi.list({ limit: BELL_SIZE }));
    } catch {
      // Falha passageira: mantém o que já está na tela e tenta de novo no próximo ciclo.
    }
  }, []);

  useEffect(() => startBellPolling(refresh), [refresh]);

  const markRead = useCallback(
    async (n: Notification) => {
      if (n.readAt) return;
      // Marca na tela na hora; o servidor confirma no próximo refresh.
      setState((s) =>
        s && {
          ...s,
          unread: Math.max(0, s.unread - 1),
          items: s.items.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)),
        },
      );
      await notificationsApi.read(n.id).catch(() => {});
      refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setState((s) => s && { ...s, unread: 0, items: s.items.map((i) => ({ ...i, readAt: i.readAt ?? now })) });
    await notificationsApi.readAll().catch(() => {});
    refresh();
  }, [refresh]);

  return <NotificationsContext.Provider value={{ state, refresh, markRead, markAllRead }}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications fora do NotificationsProvider');
  return ctx;
}

/** "Agora", "Há 12 min", "Hoje, 9h40", "Ontem, 17h05" ou "30 out 2026". Sem data válida, fica vazio. */
export function when(iso: string | null | undefined, now = new Date()) {
  const time = iso ? new Date(iso).getTime() : NaN;
  if (Number.isNaN(time)) return '';
  const minutes = Math.floor((now.getTime() - time) / 60_000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  return formatLastAccess(iso!, now);
}

/** Um item do sino. Título, texto e data podem faltar sem quebrar a lista. */
export function BellItem({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  return (
    <button type="button" className={`notification${n.readAt ? '' : ' is-unread'}`} onClick={() => onOpen(n)}>
      <span className="notification__mark" aria-hidden />
      <span className="notification__text">
        <span className="notification__title">
          {n.title || typeLabel(n.type)}
          {!n.readAt && <span className="visually-hidden"> (não lida)</span>}
        </span>
        {n.body && <span className="notification__body">{n.body}</span>}
        <span className="notification__when">{when(n.createdAt)}</span>
      </span>
    </button>
  );
}

/** Se o sino quebrar, fica só o ícone levando à página de Notificações; o resto do cabeçalho continua. */
export function BellFallback() {
  return (
    <div className="notifications">
      <Link to="/notificacoes" className="bell" aria-label="Notificações">
        <AppIcon name="bell" size={20} />
      </Link>
    </div>
  );
}

/** Sino do cabeçalho com as últimas notificações e o link para a página (quadros "ERP · Notificações · 1440"). */
export function NotificationBell() {
  const { state, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const unread = state?.unread ?? 0;
  const items = state?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>('.bell')?.focus();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  async function openItem(n: Notification) {
    setOpen(false);
    await markRead(n);
    if (n.link) navigate(n.link);
  }

  const label = unread ? `Notificações, ${unread} não ${unread === 1 ? 'lida' : 'lidas'}` : 'Notificações';

  return (
    <div className="notifications" ref={ref}>
      <button
        type="button"
        className={`bell${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <AppIcon name="bell" size={20} />
        {unread > 0 && (
          <span className="bell__count" aria-hidden>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notifications__panel" role="dialog" aria-label="Notificações">
          <div className="notifications__top">
            <h2 className="notifications__title">Notificações</h2>
            {unread > 0 && (
              <button type="button" className="notifications__all" onClick={markAllRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          {state && items.length === 0 ? (
            <div className="notifications__empty">
              <p className="notifications__empty-title">Nenhuma notificação por enquanto.</p>
              <p className="notifications__empty-text">
                Comunicados do estúdio, pedidos de exclusão e respostas aos seus pedidos aparecem aqui.
              </p>
            </div>
          ) : (
            <ul className="notifications__list">
              {items.map((n) => (
                <li key={n.id}>
                  <BellItem n={n} onOpen={openItem} />
                </li>
              ))}
            </ul>
          )}
          <div className="notifications__footer">
            <Link to="/notificacoes" className="arrow-link" onClick={() => setOpen(false)}>
              Ver todas
              <AppIcon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
