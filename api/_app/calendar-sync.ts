import { and, asc, count, eq, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { calendarSyncState, eventKind, events, type CalendarSyncState, type Event, type EventKind } from './db/schema.js';
import { audit } from './audit.js';
import {
  CALENDAR_NAME,
  CalendarError,
  googleIdFor,
  TIME_ZONE,
  zonedDate,
  zonedMidnight,
  type CalendarClient,
  type GoogleEvent,
  type GoogleEventBody,
} from './calendar.js';

/** No máximo uma consulta ao Google a cada 2 minutos, para todos (decisão da Fase 5). */
export const SYNC_INTERVAL_MS = 2 * 60_000;
/** "Tentar de novo" depois de um erro pula a espera, mas não mais que uma vez a cada 10 segundos. */
const RETRY_GAP_MS = 10_000;
/** Envios por sincronização. O resto vai na próxima, para a leitura da Agenda não demorar. */
const PUSH_BATCH = 10;
/** Páginas de 250 eventos lidas por sincronização. */
const MAX_PAGES = 20;

export type CalendarStatus = 'disconnected' | 'connected' | 'reconnect';

/** O que a tela mostra sobre a conexão. */
export interface CalendarInfo {
  status: CalendarStatus;
  lastSyncedAt: string | null;
  /** A última sincronização falhou (a tela mostra "Tentar de novo"). */
  error: boolean;
  /** Mudanças do ERP ainda não enviadas ao Google. */
  pending: number;
}

/** Campos do evento que vão para o audit_log quando um lado perde o conflito. */
function snapshot(e: Pick<Event, 'title' | 'startsAt' | 'endsAt' | 'allDay' | 'location' | 'description' | 'kind' | 'updatedAt'>) {
  return {
    title: e.title,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    allDay: e.allDay,
    location: e.location,
    description: e.description,
    kind: e.kind,
    updatedAt: e.updatedAt.toISOString(),
  };
}

/** O Google tem o mesmo que o ERP (o projeto vinculado fica só no ERP). */
function sameContent(local: Event, g: GoogleEvent): boolean {
  const r = fromGoogle(g);
  return (
    local.title === r.title &&
    local.startsAt.getTime() === r.startsAt.getTime() &&
    local.endsAt.getTime() === r.endsAt.getTime() &&
    local.allDay === r.allDay &&
    (local.location ?? null) === r.location &&
    (local.description ?? null) === r.description &&
    (local.kind ?? null) === r.kind
  );
}

function isKind(value: unknown): value is EventKind {
  return (eventKind.enumValues as readonly unknown[]).includes(value);
}

/** Evento do Google nos campos do ERP. O projeto vinculado não vai ao Google; fica só no ERP. */
export function fromGoogle(g: GoogleEvent) {
  const allDay = !!g.start?.date;
  const startsAt = g.start?.dateTime ? new Date(g.start.dateTime) : zonedMidnight(g.start?.date ?? zonedDate(new Date(g.updated)));
  const endsAt = g.end?.dateTime
    ? new Date(g.end.dateTime)
    : g.end?.date
      ? zonedMidnight(g.end.date)
      : new Date(startsAt.getTime() + (allDay ? 86_400_000 : 3_600_000));
  const kind = g.extendedProperties?.private?.kind;
  return {
    title: g.summary?.trim() || 'Sem título',
    startsAt,
    endsAt,
    allDay,
    location: g.location?.trim() || null,
    description: g.description?.trim() || null,
    kind: isKind(kind) ? kind : null,
    recurringEventId: g.recurringEventId ?? null,
    updatedAt: new Date(g.updated),
  };
}

/** Evento do ERP no formato do Google. O tipo vai como propriedade privada (não aparece para ninguém). */
export function toGoogle(e: Event): GoogleEventBody {
  const when = (at: Date) => (e.allDay ? { date: zonedDate(at) } : { dateTime: at.toISOString(), timeZone: TIME_ZONE });
  return {
    summary: e.title,
    location: e.location ?? '',
    description: e.description ?? '',
    start: when(e.startsAt),
    end: when(e.endsAt),
    extendedProperties: { private: { erpId: e.id, kind: e.kind ?? '' } },
  };
}

/**
 * Sincronização de duas vias com o calendário "De.Croqui ERP" (seção 8 e decisões da Fase 5).
 * Conflito: vale o evento inteiro e vence quem salvou por último; empate, o Google; exclusão vence edição.
 * O lado que perde vai inteiro para o audit_log.
 */
export function createCalendarSync({ db, calendar }: { db: Db; calendar: CalendarClient }) {
  async function state(): Promise<CalendarSyncState | null> {
    const [row] = await db.select().from(calendarSyncState).limit(1);
    return row ?? null;
  }

  async function info(current?: CalendarSyncState | null): Promise<CalendarInfo> {
    const s = current === undefined ? await state() : current;
    const [{ n }] = await db.select({ n: count() }).from(events).where(ne(events.syncStatus, 'synced'));
    return {
      status: s ? s.status : 'disconnected',
      lastSyncedAt: s?.lastSyncedAt?.toISOString() ?? null,
      error: !!s?.lastError,
      pending: n,
    };
  }

  async function conflict(event: Pick<Event, 'id'>, payload: Record<string, unknown>) {
    await audit(db, { userId: null, action: 'event.conflict', entity: 'event', entityId: event.id, payload });
  }

  /** O token venceu: a tela pede "Reconecte sua conta Google" em vez de falhar em silêncio. */
  async function markReconnect(s: CalendarSyncState, err: Error) {
    await db.update(calendarSyncState).set({ status: 'reconnect', lastError: err.message }).where(eq(calendarSyncState.id, s.id));
  }

  /** Evento apagado no Google. Edição do ERP ainda não enviada perde: a exclusão vence. */
  async function applyDeletion(local: Event, google: GoogleEvent | null) {
    if (local.syncStatus !== 'synced') {
      await conflict(local, { winner: 'deletion', deletedIn: 'google', lost: { side: 'erp', ...snapshot(local) } });
    } else {
      await audit(db, { userId: null, action: 'event.google_delete', entity: 'event', entityId: local.id, payload: { googleEventId: google?.id ?? local.googleEventId } });
    }
    await db
      .update(events)
      .set({ deletedAt: new Date(), syncStatus: 'synced', syncError: null, syncAttempts: 0, ...(google ? { googleEtag: google.etag } : {}) })
      .where(eq(events.id, local.id));
  }

  /** Grava a versão do Google por cima da do ERP. */
  async function applyGoogle(local: Event, g: GoogleEvent, calendarId: string) {
    await db
      .update(events)
      .set({ ...fromGoogle(g), googleEventId: g.id, googleEtag: g.etag, googleCalendarId: calendarId, deletedAt: null, syncStatus: 'synced', syncError: null, syncAttempts: 0 })
      .where(eq(events.id, local.id));
  }

  /** Uma mudança vinda do Google (leitura incremental). */
  async function applyIncoming(g: GoogleEvent, calendarId: string) {
    const erpId = g.extendedProperties?.private?.erpId;
    const [local] = await db
      .select()
      .from(events)
      .where(or(eq(events.googleEventId, g.id), erpId && /^[0-9a-f-]{36}$/i.test(erpId) ? and(eq(events.id, erpId), isNull(events.googleEventId)) : sql`false`))
      .limit(1);

    if (g.status === 'cancelled') {
      if (!local) return;
      if (local.deletedAt) {
        // Removido nos dois lados: nada a enviar.
        if (local.syncStatus !== 'synced') await db.update(events).set({ syncStatus: 'synced', syncError: null }).where(eq(events.id, local.id));
        return;
      }
      await applyDeletion(local, g);
      return;
    }

    if (!local) {
      const [created] = await db
        .insert(events)
        .values({ ...fromGoogle(g), source: 'google', googleEventId: g.id, googleEtag: g.etag, googleCalendarId: calendarId, syncStatus: 'synced' })
        .returning({ id: events.id });
      await audit(db, { userId: null, action: 'event.google_create', entity: 'event', entityId: created.id, payload: { googleEventId: g.id, title: g.summary ?? null } });
      return;
    }
    // A própria alteração do ERP voltando na leitura: nada de novo.
    if (local.googleEventId === g.id && local.googleEtag === g.etag) return;
    // Escrita do ERP cuja resposta ainda não foi gravada (ou se perdeu): mesmo conteúdo, só guarda o etag.
    if (!local.deletedAt && sameContent(local, g)) return markSent(local, g, calendarId);
    // Criado no ERP e nunca confirmado, mudado aqui depois: liga ao evento do Google e o envio manda a versão atual.
    if (!local.googleEventId) {
      await db.update(events).set({ googleEventId: g.id, googleEtag: g.etag, googleCalendarId: calendarId }).where(eq(events.id, local.id));
      return;
    }

    if (local.syncStatus !== 'synced') {
      if (local.deletedAt) {
        // Removido no ERP e alterado no Google: a exclusão vence; o envio apaga no Google.
        await conflict(local, { winner: 'deletion', deletedIn: 'erp', lost: { side: 'google', ...snapshot(fromGoogle(g)) } });
        await db.update(events).set({ googleEventId: g.id, googleEtag: g.etag }).where(eq(events.id, local.id));
        return;
      }
      const googleTime = new Date(g.updated);
      // Empate exato: vence o Google.
      if (googleTime.getTime() >= local.updatedAt.getTime()) {
        await conflict(local, { winner: 'google', erp: snapshot(local), google: snapshot(fromGoogle(g)) });
        await applyGoogle(local, g, calendarId);
      } else {
        await conflict(local, { winner: 'erp', erp: snapshot(local), google: snapshot(fromGoogle(g)) });
        // Fica a versão do ERP; com o etag novo, o envio sobrescreve o Google.
        await db.update(events).set({ googleEventId: g.id, googleEtag: g.etag }).where(eq(events.id, local.id));
      }
      return;
    }

    await applyGoogle(local, g, calendarId);
    await audit(db, {
      userId: null,
      action: 'event.google_update',
      entity: 'event',
      entityId: local.id,
      payload: { from: snapshot(local), to: snapshot(fromGoogle(g)) },
    });
  }

  /** Leitura incremental com syncToken. Token vencido (410): leitura completa e recomeça. */
  async function pull(s: CalendarSyncState): Promise<string | null> {
    let full = !s.syncToken;
    let pageToken: string | undefined;
    const seen = new Set<string>();
    for (let pages = 0; pages < MAX_PAGES; pages++) {
      let page;
      try {
        page = await calendar.list(s.calendarId, { syncToken: full ? null : s.syncToken, pageToken });
      } catch (err) {
        if (err instanceof CalendarError && err.status === 410 && !full) {
          full = true;
          pageToken = undefined;
          pages = -1;
          continue;
        }
        throw err;
      }
      for (const g of page.items) {
        seen.add(g.id);
        await applyIncoming(g, s.calendarId);
      }
      if (page.nextPageToken) {
        pageToken = page.nextPageToken;
        continue;
      }
      if (full) {
        // Leitura completa: o que o ERP tinha deste calendário e não veio foi apagado de vez no Google.
        const linked = await db
          .select()
          .from(events)
          .where(and(eq(events.googleCalendarId, s.calendarId), isNotNull(events.googleEventId), isNull(events.deletedAt)));
        for (const local of linked) if (!seen.has(local.googleEventId!)) await applyDeletion(local, null);
      }
      return page.nextSyncToken ?? s.syncToken;
    }
    // Calendário grande demais para uma vez: continua da próxima leitura completa.
    return null;
  }

  /** Grava o resultado do envio. Se o evento mudou de novo no ERP enquanto isso, continua pendente. */
  async function markSent(local: Event, g: GoogleEvent, calendarId: string) {
    await db
      .update(events)
      .set({
        googleEventId: g.id,
        googleEtag: g.etag,
        googleCalendarId: calendarId,
        syncStatus: sql`case when ${events.updatedAt} = ${local.updatedAt.toISOString()}::timestamptz then 'synced'::event_sync_status else ${events.syncStatus} end`,
        syncError: null,
        syncAttempts: 0,
      })
      .where(eq(events.id, local.id));
  }

  /** Envia ao Google a mudança pendente de um evento. Erro de rede: continua `pending` para reenviar. */
  async function pushOne(local: Event, s: CalendarSyncState): Promise<void> {
    const calendarId = s.calendarId;
    try {
      if (local.deletedAt) {
        if (local.googleEventId && local.googleCalendarId === calendarId) await calendar.remove(calendarId, local.googleEventId);
        await db.update(events).set({ syncStatus: 'synced', syncError: null, syncAttempts: 0 }).where(eq(events.id, local.id));
        return;
      }
      if (!local.googleEventId || local.googleCalendarId !== calendarId) {
        const id = googleIdFor(local.id);
        let g: GoogleEvent | null;
        try {
          g = await calendar.insert(calendarId, { ...toGoogle(local), id });
        } catch (err) {
          // Já criado antes (resposta perdida): pega o que está lá.
          if (!(err instanceof CalendarError && err.status === 409)) throw err;
          g = await calendar.get(calendarId, id);
          if (!g || g.status === 'cancelled') return applyDeletion(local, g);
        }
        await markSent(local, g, calendarId);
        return;
      }
      let g: GoogleEvent;
      try {
        g = await calendar.patch(calendarId, local.googleEventId, toGoogle(local), local.googleEtag);
      } catch (err) {
        if (!(err instanceof CalendarError)) throw err;
        if (err.status === 404 || err.status === 410) return applyDeletion(local, null);
        if (err.status !== 412) throw err;
        // O Google mudou desde a última leitura: vence quem salvou por último; empate, o Google.
        const current = await calendar.get(calendarId, local.googleEventId);
        if (!current || current.status === 'cancelled') return applyDeletion(local, current);
        if (new Date(current.updated).getTime() >= local.updatedAt.getTime()) {
          await conflict(local, { winner: 'google', erp: snapshot(local), google: snapshot(fromGoogle(current)) });
          return applyGoogle(local, current, calendarId);
        }
        await conflict(local, { winner: 'erp', erp: snapshot(local), google: snapshot(fromGoogle(current)) });
        g = await calendar.patch(calendarId, local.googleEventId, toGoogle(local), current.etag);
      }
      await markSent(local, g, calendarId);
    } catch (err) {
      if (err instanceof CalendarError && err.reconnect) throw err;
      // Recusa definitiva do Google (dados inválidos, sem acesso): reenviar não resolve.
      const permanent = err instanceof CalendarError && err.status !== null && [400, 403].includes(err.status);
      await db
        .update(events)
        .set({ syncStatus: permanent ? 'error' : 'pending', syncError: (err as Error).message, syncAttempts: sql`${events.syncAttempts} + 1` })
        .where(eq(events.id, local.id));
    }
  }

  async function pushPending(s: CalendarSyncState) {
    const queue = await db.select().from(events).where(eq(events.syncStatus, 'pending')).orderBy(asc(events.updatedAt)).limit(PUSH_BATCH);
    for (const local of queue) await pushOne(local, s);
  }

  /**
   * Sincroniza se já passou o intervalo desde a última consulta (de quem quer que seja).
   * `retry`: "Tentar de novo" depois de um erro. Nunca lança: o erro fica registrado na conexão.
   */
  async function sync({ retry = false, now = new Date() }: { retry?: boolean; now?: Date } = {}): Promise<CalendarInfo> {
    const due = or(
      isNull(calendarSyncState.lastAttemptAt),
      lt(calendarSyncState.lastAttemptAt, new Date(now.getTime() - SYNC_INTERVAL_MS)),
      // Conexão vencida: confere a cada leitura se o administrador já entrou de novo (só renova o token).
      eq(calendarSyncState.status, 'reconnect'),
      retry ? and(isNotNull(calendarSyncState.lastError), lt(calendarSyncState.lastAttemptAt, new Date(now.getTime() - RETRY_GAP_MS))) : sql`false`,
    );
    // Quem conseguir marcar o horário faz a consulta; as leituras simultâneas só leem o banco.
    const [claimed] = await db.update(calendarSyncState).set({ lastAttemptAt: now }).where(due).returning();
    if (!claimed) return info();
    try {
      const syncToken = await pull(claimed);
      await pushPending(claimed);
      const [done] = await db
        .update(calendarSyncState)
        .set({ syncToken, lastSyncedAt: new Date(), lastError: null, status: 'connected' })
        .where(eq(calendarSyncState.id, claimed.id))
        .returning();
      return info(done ?? null);
    } catch (err) {
      if (err instanceof CalendarError && err.reconnect) await markReconnect(claimed, err);
      else await db.update(calendarSyncState).set({ lastError: (err as Error).message }).where(eq(calendarSyncState.id, claimed.id));
      return info();
    }
  }

  return {
    state,
    info,
    sync,

    /** Logo depois de salvar no ERP: envia na hora. Sem conexão, o evento fica pendente. */
    async push(eventId: string): Promise<void> {
      const s = await state();
      if (!s || s.status !== 'connected') return;
      const [local] = await db.select().from(events).where(eq(events.id, eventId));
      if (!local || local.syncStatus !== 'pending') return;
      try {
        await pushOne(local, s);
      } catch (err) {
        if (err instanceof CalendarError && err.reconnect) await markReconnect(s, err);
      }
    },

    /**
     * Conecta o calendário "De.Croqui ERP" (o que já existe na conta do administrador ou um novo).
     * Eventos que não estão nele entram na fila de envio.
     */
    async connect(userId: string): Promise<CalendarInfo> {
      const calendarId = await calendar.ensureCalendar(CALENDAR_NAME);
      await db.transaction(async (tx) => {
        await tx.delete(calendarSyncState);
        await tx.insert(calendarSyncState).values({ userId, calendarId });
        await tx
          .update(events)
          .set({ syncStatus: 'pending', syncAttempts: 0, syncError: null })
          .where(and(isNull(events.deletedAt), or(isNull(events.googleCalendarId), ne(events.googleCalendarId, calendarId))));
        await audit(tx, { userId, action: 'calendar.connect', entity: 'calendar', entityId: calendarId, payload: { name: CALENDAR_NAME } });
      });
      return sync();
    },

    /** Para a sincronização e esquece o calendário. Não revoga o acesso no Google: o Drive usa o mesmo token. */
    async disconnect(userId: string): Promise<CalendarInfo> {
      const s = await state();
      if (s) {
        await db.transaction(async (tx) => {
          await tx.delete(calendarSyncState);
          await audit(tx, { userId, action: 'calendar.disconnect', entity: 'calendar', entityId: s.calendarId, payload: { name: CALENDAR_NAME } });
        });
      }
      return info(null);
    },
  };
}

export type CalendarSync = ReturnType<typeof createCalendarSync>;
