import { cached, invalidate, mutate, prime, request, TTL } from './http';

export type EventKind = 'site_visit' | 'client_meeting' | 'delivery' | 'internal_deadline' | 'personal';

export interface AgendaEvent {
  id: string;
  title: string;
  /** ISO. No dia inteiro, meia-noite de São Paulo; o fim é exclusivo. */
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  kind: EventKind | null;
  projectId: string | null;
  projectName: string | null;
  source: 'erp' | 'google';
  syncStatus: 'synced' | 'pending' | 'error';
  recurring: boolean;
  googleUrl: string | null;
  conflict: { winner: 'google' | 'erp'; at: string } | null;
}

export interface CalendarInfo {
  status: 'disconnected' | 'connected' | 'reconnect';
  lastSyncedAt: string | null;
  error: boolean;
  pending: number;
}

export interface AgendaPage {
  events: AgendaEvent[];
  calendar: CalendarInfo;
}

export interface EventInput {
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  kind: EventKind | null;
  projectId: string | null;
}

/** Na Agenda aberta, a tela lê de novo neste intervalo (com a aba visível). O servidor consulta o Google no mesmo ritmo. */
export const AGENDA_POLL_MS = 2 * 60_000;

const key = (from: string, to: string) => `events:${from}|${to}`;

// Cada período tem sua chave. Gravar esquece todos os períodos; a tela guarda de volta o período que está aberto,
// já com a mudança, para a próxima visita não buscar de novo.
export const eventsApi = {
  /** Eventos do período e a situação do Google Agenda, numa leitura só. `retry`: "Tentar de novo" depois de um erro. */
  range: (from: string, to: string, opts: { force?: boolean; retry?: boolean } = {}) =>
    cached(
      key(from, to),
      TTL.events,
      () =>
        request<AgendaPage>(
          'GET',
          `/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${opts.retry ? '&retry=1' : ''}`,
        ),
      { force: opts.force || opts.retry },
    ),
  remember: (from: string, to: string, page: AgendaPage) => prime(key(from, to), page),
  create: (input: EventInput) => mutate(request<AgendaEvent>('POST', '/events', input), 'events:'),
  update: (id: string, input: EventInput) => mutate(request<AgendaEvent>('PATCH', `/events/${id}`, input), 'events:'),
  remove: (id: string) => mutate(request<void>('DELETE', `/events/${id}`), 'events:'),
  connect: () => mutate(request<CalendarInfo>('POST', '/calendar/connect'), 'events:'),
  disconnect: () => mutate(request<CalendarInfo>('POST', '/calendar/disconnect'), 'events:'),
  forget: () => invalidate('events:'),
};
