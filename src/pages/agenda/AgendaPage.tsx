import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Icon, Toast } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { LoadError } from '../../ui/LoadError';
import { useSession } from '../../session';
import { useIsMobile } from '../../ui/useMediaQuery';
import { startBellPolling } from '../../layout/bellPolling';
import { AGENDA_POLL_MS, eventsApi, type AgendaEvent, type AgendaPage as Page, type EventInput } from '../../api/events';
import { canEditEvent, canWriteEvents, connectionNotice, KINDS, kindClass, NO_KIND_LABEL, withEvent, withoutEvent } from './agenda';
import { addDays, periodLabel, shiftAnchor, startOfDay, viewRange, type AgendaView } from './dates';
import { ListView, MonthGrid, TimeGrid } from './AgendaViews';
import { EventPanel } from './EventPanel';
import { EventFormPanel } from './EventFormPanel';
import { DisconnectDialog, RemoveEventDialog } from './AgendaDialogs';

const LOAD_ERROR = 'Não foi possível carregar a agenda.';
const VIEWS: { value: AgendaView; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'list', label: 'Lista' },
];

interface Notice {
  tone: 'neutral' | 'danger';
  message: string;
}

/**
 * Agenda (quadros "ERP · Agenda" no Figcraft). Uma leitura traz os eventos do período e a situação do
 * Google Agenda; com a aba visível, a tela lê de novo a cada 2 minutos. Criar, editar e remover mudam a
 * tela com a resposta do servidor, sem nova leitura; só um erro faz buscar de novo. No celular, lista.
 */
export function AgendaPage() {
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const isAdmin = me?.role === 'admin';
  const canWrite = canWriteEvents(me);
  const isMobile = useIsMobile();

  const [view, setView] = useState<AgendaView>('week');
  const shownView: AgendaView = isMobile ? 'list' : view;
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const range = useMemo(() => viewRange(shownView, anchor), [shownView, anchor]);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const [page, setPageState] = useState<Page | null>(null);
  const pageRef = useRef<Page | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ event?: AgendaEvent } | null>(null);
  const [removing, setRemoving] = useState<AgendaEvent | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const setPage = useCallback((next: Page | null) => {
    pageRef.current = next;
    setPageState(next);
  }, []);

  const load = useCallback(
    async (opts: { force?: boolean; retry?: boolean } = {}) => {
      const { from, to } = rangeRef.current;
      try {
        const next = await eventsApi.range(from.toISOString(), to.toISOString(), opts);
        // Resposta de um período que a pessoa já deixou: não substitui o que está na tela.
        if (rangeRef.current.from.getTime() === from.getTime() && rangeRef.current.to.getTime() === to.getTime()) setPage(next);
        setLoadError(null);
      } catch (err) {
        setLoadError(err);
      }
    },
    [setPage],
  );

  // Uma leitura ao abrir e a cada troca de período (do cache, se for recente).
  useEffect(() => {
    load();
  }, [range, load]);

  // Releitura a cada 2 minutos, só com a aba visível. A primeira volta é a leitura de cima.
  useEffect(() => {
    let first = true;
    return startBellPolling(
      () => {
        if (first) first = false;
        else load({ force: true });
      },
      { interval: AGENDA_POLL_MS },
    );
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /** Guarda na tela e no cache o período aberto, já com a mudança. */
  function remember(next: Page) {
    setPage(next);
    const { from, to } = rangeRef.current;
    eventsApi.remember(from.toISOString(), to.toISOString(), next);
  }

  async function save(input: EventInput, existing?: AgendaEvent) {
    let saved: AgendaEvent;
    try {
      saved = existing ? await eventsApi.update(existing.id, input) : await eventsApi.create(input);
    } catch (err) {
      // O evento pode ter mudado ou sumido (no Google, por outra pessoa): confere com o servidor.
      load({ force: true });
      throw err;
    }
    const current = pageRef.current;
    if (current) remember(withEvent(current, saved, rangeRef.current.from, rangeRef.current.to));
    setForm(null);
    setOpenId(saved.id);
    setNotice({
      tone: 'neutral',
      message:
        saved.syncStatus === 'synced'
          ? existing
            ? 'Evento salvo e enviado ao Google Agenda.'
            : 'Evento criado e enviado ao Google Agenda.'
          : 'Evento salvo no ERP. Ainda não foi para o Google Agenda; tentaremos de novo.',
    });
  }

  async function remove(event: AgendaEvent) {
    const current = pageRef.current;
    // Some da tela na hora; se o servidor recusar, volta e confere.
    if (current) setPage(withoutEvent(current, event.id));
    try {
      await eventsApi.remove(event.id);
    } catch (err) {
      if (current) setPage(current);
      load({ force: true });
      throw err;
    }
    if (pageRef.current) remember(pageRef.current);
    setRemoving(null);
    setOpenId(null);
    setNotice({ tone: 'neutral', message: `${event.title} removido.` });
  }

  async function connect() {
    setConnecting(true);
    try {
      await eventsApi.connect();
      setNotice({ tone: 'neutral', message: 'Google Agenda conectado. Os eventos do ERP estão sendo enviados.' });
    } catch {
      setNotice({ tone: 'danger', message: 'Não foi possível conectar o Google Agenda. Tente de novo.' });
    } finally {
      setConnecting(false);
      load({ force: true });
    }
  }

  async function disconnect() {
    await eventsApi.disconnect();
    setDisconnecting(false);
    setNotice({ tone: 'neutral', message: 'Google Agenda desconectado. O Drive continua funcionando.' });
    load({ force: true });
  }

  function onConnectionAction(action: string) {
    if (action === 'connect') connect();
    else if (action === 'reconnect') window.location.assign('/api/auth/google?reconectar=1');
    else if (action === 'retry') load({ retry: true });
    else if (action === 'disconnect') setDisconnecting(true);
  }

  const events = page?.events ?? [];
  const opened = openId ? events.find((e) => e.id === openId) ?? null : null;
  const conn = page ? connectionNotice(page.calendar, isAdmin) : null;

  let content: ReactNode;
  if (loadError != null && !page) {
    content = <LoadError error={loadError} message={LOAD_ERROR} onRetry={() => load({ force: true })} />;
  } else if (!page) {
    content = <p className="agenda-empty">Carregando a agenda.</p>;
  } else if (shownView === 'month') {
    content = (
      <MonthGrid
        from={range.from}
        month={anchor.getMonth()}
        events={events}
        onOpen={(e) => setOpenId(e.id)}
        onOpenDay={(d) => {
          setAnchor(d);
          setView('day');
        }}
      />
    );
  } else if (shownView === 'list') {
    content = <ListView from={range.from} events={events} onOpen={(e) => setOpenId(e.id)} />;
  } else {
    const days = Array.from({ length: shownView === 'day' ? 1 : 7 }, (_, i) => addDays(range.from, i));
    content = <TimeGrid days={days} events={events} onOpen={(e) => setOpenId(e.id)} />;
  }

  return (
    <section className="agenda">
      <header className="page-header agenda-header">
        <div>
          <p className="page-header__eyebrow">Estúdio · Agenda</p>
          <h1 className="page-header__title">Agenda</h1>
          {isMobile && conn && <ConnectionBar notice={conn} busy={connecting} onAction={onConnectionAction} />}
        </div>
        <div className="agenda-header__actions">
          {!isMobile && conn && <ConnectionBar notice={conn} busy={connecting} onAction={onConnectionAction} />}
          {canWrite && (
            <Button
              variant="primary"
              iconLeft="plus"
              onClick={() => {
                setOpenId(null);
                setForm({});
              }}
            >
              Novo evento
            </Button>
          )}
        </div>
      </header>

      <div className="agenda-toolbar">
        <div className="agenda-nav">
          <button type="button" className="agenda-nav__button" onClick={() => setAnchor(startOfDay(new Date()))}>
            Hoje
          </button>
          <button type="button" className="agenda-nav__button agenda-nav__button--icon" aria-label="Período anterior" onClick={() => setAnchor(shiftAnchor(shownView, anchor, -1))}>
            <Icon name="chevron-left" size={16} strokeWidth={1.25} />
          </button>
          <button type="button" className="agenda-nav__button agenda-nav__button--icon" aria-label="Próximo período" onClick={() => setAnchor(shiftAnchor(shownView, anchor, 1))}>
            <Icon name="chevron-right" size={16} strokeWidth={1.25} />
          </button>
          <h2 className="agenda-nav__period" aria-live="polite">
            {periodLabel(shownView, anchor, isMobile)}
          </h2>
        </div>
        {!isMobile && (
          <div className="agenda-views" role="group" aria-label="Visualização">
            {VIEWS.map((v) => (
              <button key={v.value} type="button" className={`agenda-views__item${view === v.value ? ' is-active' : ''}`} aria-pressed={view === v.value} onClick={() => setView(v.value)}>
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isMobile && (
        <ul className="agenda-legend" aria-label="Tipos de evento">
          {[...KINDS, { value: null, label: NO_KIND_LABEL }].map((k) => (
            <li key={k.label} className={`agenda-legend__item ${kindClass(k.value)}`}>
              {k.label}
            </li>
          ))}
        </ul>
      )}

      {content}

      {opened && page && !form && (
        <EventPanel
          event={opened}
          calendar={page.calendar}
          canEdit={canEditEvent(me, opened)}
          canOpenGoogle={isAdmin}
          onClose={() => setOpenId(null)}
          onEdit={() => setForm({ event: opened })}
          onRemove={() => setRemoving(opened)}
        />
      )}

      {form && (
        <EventFormPanel
          event={form.event}
          day={shownView === 'day' ? anchor : startOfDay(new Date()) >= range.from && startOfDay(new Date()) < range.to ? new Date() : range.from}
          onClose={() => setForm(null)}
          onSave={(input) => save(input, form.event)}
        />
      )}

      {removing && <RemoveEventDialog event={removing} onClose={() => setRemoving(null)} onRemove={() => remove(removing)} />}
      {disconnecting && <DisconnectDialog onClose={() => setDisconnecting(false)} onDisconnect={disconnect} />}

      <div className="toast-slot" aria-live="polite">
        {notice && <Toast tone={notice.tone} message={notice.message} onClose={() => setNotice(null)} />}
      </div>
    </section>
  );
}

/** Situação do Google Agenda no topo: aviso (desconectado, vencido, erro) ou a linha "Sincronizado". */
function ConnectionBar({ notice, busy, onAction }: { notice: ReturnType<typeof connectionNotice>; busy: boolean; onAction: (a: string) => void }) {
  return (
    <div className={`agenda-connection agenda-connection--${notice.tone}`} role={notice.tone === 'danger' ? 'alert' : 'status'}>
      {notice.tone !== 'quiet' && <AppIcon name="triangle-alert" size={16} />}
      <span>{notice.text}</span>
      {notice.action && (
        <button type="button" className="agenda-connection__action" disabled={busy} aria-busy={busy || undefined} onClick={() => onAction(notice.action!)}>
          {busy ? 'Conectando' : notice.actionLabel}
        </button>
      )}
    </div>
  );
}
