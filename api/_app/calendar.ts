import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { AdminTokenError, createAdminAccessToken } from './admin-token.js';

const API = 'https://www.googleapis.com/calendar/v3';
/** Cada chamada ao Google tem limite: a leitura da Agenda não pode ficar presa esperando. */
const CALL_TIMEOUT_MS = 6_000;

export const CALENDAR_NAME = 'De.Croqui ERP';
/** Fuso do estúdio. Eventos de dia inteiro começam à meia-noite daqui. */
export const TIME_ZONE = 'America/Sao_Paulo';

/** Evento como o Google devolve (só os campos que o ERP usa). */
export interface GoogleEvent {
  id: string;
  etag: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  /** Horário da última alteração no Google (ISO). Decide os conflitos. */
  updated: string;
  summary?: string;
  location?: string;
  description?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  recurringEventId?: string;
  extendedProperties?: { private?: Record<string, string> };
}

/** O que o ERP envia ao criar ou alterar. Sem participantes: o ERP não convida ninguém. */
export interface GoogleEventBody {
  id?: string;
  summary: string;
  location: string;
  description: string;
  start: { dateTime: string; timeZone: string } | { date: string };
  end: { dateTime: string; timeZone: string } | { date: string };
  extendedProperties: { private: Record<string, string> };
}

export interface EventPage {
  items: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

/**
 * Falha ao falar com o Google Agenda. `status` nulo: rede ou tempo esgotado (vale tentar de novo).
 * `reconnect`: o token do administrador venceu; só entrando de novo com o Google.
 */
export class CalendarError extends Error {
  constructor(
    message: string,
    public status: number | null = null,
    public reconnect = false,
  ) {
    super(message);
  }
}

/** Operações do Google Agenda que o ERP usa. Substituível nos testes. */
export interface CalendarClient {
  /** ID do calendário com esse nome na conta do administrador: o que já existe ou um novo. */
  ensureCalendar(name: string): Promise<string>;
  /** Sem `syncToken`: leitura completa. Com ele: só o que mudou. Token vencido: CalendarError 410. */
  list(calendarId: string, opts: { syncToken?: string | null; pageToken?: string }): Promise<EventPage>;
  /** Cria com o ID dado. ID que já existe: CalendarError 409. */
  insert(calendarId: string, body: GoogleEventBody): Promise<GoogleEvent>;
  /** Altera só se o evento ainda tiver esse etag. Mudou no Google: CalendarError 412. Não existe: 404 ou 410. */
  patch(calendarId: string, eventId: string, body: GoogleEventBody, etag: string | null): Promise<GoogleEvent>;
  /** Evento cancelado vem com status `cancelled`; o que não existe, nulo. */
  get(calendarId: string, eventId: string): Promise<GoogleEvent | null>;
  /** Manda para a lixeira do Google. O que já não existe conta como removido. */
  remove(calendarId: string, eventId: string): Promise<void>;
}

/** Google Agenda do administrador, com o mesmo token do Drive. Nenhuma chamada envia convite ou e-mail. */
export function createAdminCalendar({ config, db, fetch: doFetch = fetch }: { config: Config; db: Db; fetch?: typeof fetch }): CalendarClient {
  const token = createAdminAccessToken({ config, db, fetch: doFetch });

  async function call(path: string, init: RequestInit = {}): Promise<Response> {
    let bearer: string;
    try {
      bearer = await token.accessToken();
    } catch (err) {
      if (err instanceof AdminTokenError) throw new CalendarError(err.message, null, err.reconnect);
      throw err;
    }
    let res: Response;
    try {
      res = await doFetch(`${API}${path}`, {
        ...init,
        headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json', ...init.headers },
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
    } catch (err) {
      throw new CalendarError(`Google Agenda sem resposta (${(err as Error).name}).`);
    }
    if (res.status === 401) token.forget();
    return res;
  }

  async function fail(res: Response, what: string): Promise<never> {
    throw new CalendarError(`${what} falhou (${res.status}).`, res.status);
  }

  const events = (calendarId: string) => `/calendars/${encodeURIComponent(calendarId)}/events`;

  return {
    async ensureCalendar(name) {
      let pageToken: string | undefined;
      do {
        const q = new URLSearchParams({ minAccessRole: 'owner', ...(pageToken ? { pageToken } : {}) });
        const res = await call(`/users/me/calendarList?${q}`);
        if (!res.ok) await fail(res, 'Leitura dos calendários');
        const body = (await res.json()) as { items?: { id: string; summary?: string; deleted?: boolean }[]; nextPageToken?: string };
        const found = body.items?.find((c) => c.summary === name && !c.deleted);
        if (found) return found.id;
        pageToken = body.nextPageToken;
      } while (pageToken);
      const res = await call('/calendars', { method: 'POST', body: JSON.stringify({ summary: name, timeZone: TIME_ZONE }) });
      if (!res.ok) await fail(res, 'Criação do calendário');
      return ((await res.json()) as { id: string }).id;
    },

    async list(calendarId, { syncToken, pageToken }) {
      // singleEvents: cada ocorrência de uma série vem como um evento. showDeleted: os cancelados também vêm.
      const q = new URLSearchParams({ singleEvents: 'true', showDeleted: 'true', maxResults: '250' });
      if (syncToken) q.set('syncToken', syncToken);
      if (pageToken) q.set('pageToken', pageToken);
      const res = await call(`${events(calendarId)}?${q}`);
      if (!res.ok) await fail(res, 'Leitura dos eventos');
      return (await res.json()) as EventPage;
    },

    async insert(calendarId, body) {
      const res = await call(`${events(calendarId)}?sendUpdates=none`, { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) await fail(res, 'Criação do evento');
      return (await res.json()) as GoogleEvent;
    },

    async patch(calendarId, eventId, body, etag) {
      const res = await call(`${events(calendarId)}/${encodeURIComponent(eventId)}?sendUpdates=none`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: etag ? { 'if-match': etag } : {},
      });
      if (!res.ok) await fail(res, 'Alteração do evento');
      return (await res.json()) as GoogleEvent;
    },

    async get(calendarId, eventId) {
      const res = await call(`${events(calendarId)}/${encodeURIComponent(eventId)}`);
      if (res.status === 404 || res.status === 410) return null;
      if (!res.ok) await fail(res, 'Leitura do evento');
      return (await res.json()) as GoogleEvent;
    },

    async remove(calendarId, eventId) {
      const res = await call(`${events(calendarId)}/${encodeURIComponent(eventId)}?sendUpdates=none`, { method: 'DELETE' });
      if (res.ok || res.status === 404 || res.status === 410) return;
      await fail(res, 'Remoção do evento');
    },
  };
}

/** Diferença, em minutos, entre o relógio de São Paulo e o UTC naquele instante. */
function zoneOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const v = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return (Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second')) - at.getTime()) / 60_000;
}

/** Meia-noite de São Paulo no dia `YYYY-MM-DD`. */
export function zonedMidnight(date: string): Date {
  const guess = new Date(`${date}T00:00:00Z`);
  return new Date(guess.getTime() - zoneOffsetMinutes(guess) * 60_000);
}

/** Dia (`YYYY-MM-DD`) daquele instante em São Paulo. */
export function zonedDate(at: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

/**
 * ID do evento no Google para um evento criado no ERP: o UUID sem hífens (o Google aceita 0-9 e a-v).
 * Reenviar a criação depois de uma resposta perdida não duplica o evento: o Google responde 409.
 */
export function googleIdFor(eventId: string): string {
  return eventId.replace(/-/g, '').toLowerCase();
}
