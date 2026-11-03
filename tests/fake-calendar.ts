import { CalendarError, type CalendarClient, type EventPage, type GoogleEvent, type GoogleEventBody } from '../api/_app/calendar.js';

type Op = keyof CalendarClient;
interface Stored extends GoogleEvent {
  calendarId: string;
  seq: number;
  version: number;
}

/**
 * Google Agenda em memória para os testes. Guarda etag, `updated` e a ordem das mudanças (para o syncToken).
 * `fail` faz a próxima chamada de uma operação falhar: rede (status nulo), código HTTP ou token vencido.
 */
export class FakeCalendar implements CalendarClient {
  calendars = new Map<string, string>();
  events = new Map<string, Stored>();
  calls: Op[] = [];
  /** Falhas programadas: cada uma vale para `times` chamadas da operação (padrão 1). */
  failures: { op: Op | '*'; status?: number | null; reconnect?: boolean; times: number }[] = [];
  /** Tokens com número menor que este respondem 410 (vencidos). */
  minToken = 0;
  private seq = 0;
  private ids = 0;

  fail(op: Op | '*', opts: { status?: number | null; reconnect?: boolean; times?: number } = {}) {
    this.failures.push({ op, status: opts.status ?? null, reconnect: opts.reconnect, times: opts.times ?? 1 });
  }

  private check(op: Op) {
    this.calls.push(op);
    const f = this.failures.find((x) => (x.op === op || x.op === '*') && x.times > 0);
    if (!f) return;
    f.times--;
    throw new CalendarError(`falha simulada em ${op}`, f.status ?? null, !!f.reconnect);
  }

  private touch(e: Stored, at: Date) {
    e.version++;
    e.etag = `"${e.id}-${e.version}"`;
    e.updated = at.toISOString();
    e.seq = ++this.seq;
  }

  private copy(e: Stored): GoogleEvent {
    const { calendarId: _c, seq: _s, version: _v, ...rest } = e;
    return structuredClone(rest);
  }

  async ensureCalendar(name: string) {
    this.check('ensureCalendar');
    for (const [id, n] of this.calendars) if (n === name) return id;
    const id = `cal-${this.calendars.size + 1}@group.calendar.google.com`;
    this.calendars.set(id, name);
    return id;
  }

  async list(calendarId: string, { syncToken, pageToken }: { syncToken?: string | null; pageToken?: string }): Promise<EventPage> {
    this.check('list');
    const since = syncToken ? Number(syncToken.replace('tok-', '')) : 0;
    if (syncToken && since < this.minToken) throw new CalendarError('token vencido', 410);
    const all = [...this.events.values()].filter((e) => e.calendarId === calendarId && e.seq > since).sort((a, b) => a.seq - b.seq);
    // Duas por página, para exercitar a paginação.
    const start = pageToken ? Number(pageToken) : 0;
    const items = all.slice(start, start + 2).map((e) => this.copy(e));
    if (start + 2 < all.length) return { items, nextPageToken: String(start + 2) };
    return { items, nextSyncToken: `tok-${this.seq}` };
  }

  async insert(calendarId: string, body: GoogleEventBody) {
    this.check('insert');
    const id = body.id ?? `g${++this.ids}`;
    if (this.events.has(id)) throw new CalendarError('já existe', 409);
    const e: Stored = { ...structuredClone(body), id, etag: '', status: 'confirmed', updated: '', calendarId, seq: 0, version: 0 };
    this.touch(e, new Date());
    this.events.set(id, e);
    return this.copy(e);
  }

  async patch(calendarId: string, eventId: string, body: GoogleEventBody, etag: string | null) {
    this.check('patch');
    const e = this.events.get(eventId);
    if (!e || e.calendarId !== calendarId) throw new CalendarError('não existe', 404);
    if (e.status === 'cancelled') throw new CalendarError('removido', 410);
    if (etag && etag !== e.etag) throw new CalendarError('mudou no Google', 412);
    Object.assign(e, structuredClone(body));
    this.touch(e, new Date());
    return this.copy(e);
  }

  async get(calendarId: string, eventId: string) {
    this.check('get');
    const e = this.events.get(eventId);
    return e && e.calendarId === calendarId ? this.copy(e) : null;
  }

  async remove(calendarId: string, eventId: string) {
    this.check('remove');
    const e = this.events.get(eventId);
    if (!e || e.calendarId !== calendarId || e.status === 'cancelled') return;
    e.status = 'cancelled';
    this.touch(e, new Date());
  }

  // Ações de quem usa o Google Agenda direto, fora do ERP.

  googleCreate(calendarId: string, fields: Partial<GoogleEvent>, at = new Date()) {
    const id = `g${++this.ids}`;
    const e: Stored = {
      summary: 'Evento do Google',
      start: { dateTime: '2026-11-05T13:00:00.000Z' },
      end: { dateTime: '2026-11-05T14:00:00.000Z' },
      ...structuredClone(fields),
      id,
      etag: '',
      status: 'confirmed',
      updated: '',
      calendarId,
      seq: 0,
      version: 0,
    };
    this.touch(e, at);
    this.events.set(id, e);
    return id;
  }

  googleEdit(eventId: string, fields: Partial<GoogleEvent>, at = new Date()) {
    const e = this.events.get(eventId)!;
    Object.assign(e, structuredClone(fields));
    this.touch(e, at);
  }

  googleDelete(eventId: string, at = new Date()) {
    const e = this.events.get(eventId)!;
    e.status = 'cancelled';
    this.touch(e, at);
  }

  /** O evento sai de vez do Google (some até da leitura completa). */
  purge(eventId: string) {
    this.events.delete(eventId);
  }
}
