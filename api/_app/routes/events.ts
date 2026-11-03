import type { FastifyInstance } from 'fastify';
import { and, asc, desc, eq, gt, inArray, isNull, lt } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { auditLog, eventKind, events, projects, type Event, type EventKind } from '../db/schema.js';
import { audit } from '../audit.js';
import { CalendarError, zonedDate, zonedMidnight } from '../calendar.js';
import type { CalendarSync } from '../calendar-sync.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_TITLE = 120;
export const MAX_LOCATION = 200;
export const MAX_DESCRIPTION = 2000;
/** Maior período de uma leitura: o mês com as semanas das pontas (6 semanas), com folga. */
export const MAX_RANGE_DAYS = 62;
/** Por quantos dias o painel do evento conta que houve conflito. */
export const CONFLICT_NOTE_DAYS = 7;

/** Evento como a tela recebe. */
export interface EventDto {
  id: string;
  title: string;
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
  /** Ocorrência de uma série do Google: aparece, mas o ERP não edita nem remove. */
  recurring: boolean;
  /** Endereço do evento no Google Agenda (só abre na conta do administrador, dona do calendário). */
  googleUrl: string | null;
  /** Conflito recente: qual lado ficou e quando. A versão que perdeu está no audit_log. */
  conflict: { winner: 'google' | 'erp'; at: string } | null;
}

/** Link do Google Agenda para o evento: `eid` é o ID do evento e o do calendário, em base64. */
export function googleEventUrl(googleEventId: string, calendarId: string): string {
  const eid = Buffer.from(`${googleEventId} ${calendarId}`).toString('base64').replace(/=+$/, '');
  return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(eid)}`;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function instant(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Fields = Pick<Event, 'title' | 'startsAt' | 'endsAt' | 'allDay' | 'location' | 'description' | 'kind' | 'projectId'>;

export async function eventsRoutes(app: FastifyInstance, { db, sync }: { db: Db; sync: CalendarSync }) {
  async function dto(id: string): Promise<EventDto | null> {
    const [row] = await db
      .select({ e: events, projectName: projects.name })
      .from(events)
      .leftJoin(projects, eq(projects.id, events.projectId))
      .where(and(eq(events.id, id), isNull(events.deletedAt)));
    if (!row) return null;
    const conflicts = await recentConflicts([id]);
    return toDto(row.e, row.projectName, conflicts.get(id) ?? null);
  }

  /** Último conflito dos últimos dias de cada evento, numa consulta só. */
  async function recentConflicts(ids: string[]): Promise<Map<string, EventDto['conflict']>> {
    const found = new Map<string, EventDto['conflict']>();
    if (!ids.length) return found;
    const rows = await db
      .select({ entityId: auditLog.entityId, payload: auditLog.payload, at: auditLog.at })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.action, 'event.conflict'),
          inArray(auditLog.entityId, ids),
          gt(auditLog.at, new Date(Date.now() - CONFLICT_NOTE_DAYS * 86_400_000)),
        ),
      )
      .orderBy(desc(auditLog.at));
    for (const r of rows) {
      const winner = r.payload.winner;
      if (found.has(r.entityId) || (winner !== 'google' && winner !== 'erp')) continue;
      found.set(r.entityId, { winner, at: r.at.toISOString() });
    }
    return found;
  }

  function toDto(e: Event, projectName: string | null, conflict: EventDto['conflict'] = null): EventDto {
    return {
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      allDay: e.allDay,
      location: e.location,
      description: e.description,
      kind: e.kind,
      projectId: e.projectId,
      projectName,
      source: e.source,
      syncStatus: e.syncStatus,
      recurring: !!e.recurringEventId,
      googleUrl: e.googleEventId && e.googleCalendarId ? googleEventUrl(e.googleEventId, e.googleCalendarId) : null,
      conflict,
    };
  }

  /** Valida o corpo do criar e do editar. Dia inteiro: começo e fim vão para a meia-noite de São Paulo. */
  async function parse(body: Record<string, unknown> | undefined): Promise<{ fields: Fields } | { errors: Record<string, string> }> {
    const b = body ?? {};
    const errors: Record<string, string> = {};
    const title = text(b.title).replace(/\s+/g, ' ');
    if (!title) errors.title = 'required';
    else if (title.length > MAX_TITLE) errors.title = 'too_long';
    const allDay = b.allDay === true;
    let startsAt = instant(b.startsAt);
    let endsAt = instant(b.endsAt);
    if (!startsAt) errors.startsAt = 'invalid';
    if (!endsAt) errors.endsAt = 'invalid';
    if (startsAt && endsAt && allDay) {
      startsAt = zonedMidnight(zonedDate(startsAt));
      endsAt = zonedMidnight(zonedDate(endsAt));
    }
    if (startsAt && endsAt && endsAt <= startsAt) errors.endsAt = 'before_start';
    const location = text(b.location) || null;
    if (location && location.length > MAX_LOCATION) errors.location = 'too_long';
    const description = text(b.description) || null;
    if (description && description.length > MAX_DESCRIPTION) errors.description = 'too_long';
    const kind = b.kind === null || b.kind === undefined || b.kind === '' ? null : b.kind;
    if (kind !== null && !(eventKind.enumValues as readonly unknown[]).includes(kind)) errors.kind = 'invalid';
    const projectId = b.projectId === null || b.projectId === undefined || b.projectId === '' ? null : b.projectId;
    if (projectId !== null) {
      const [p] =
        typeof projectId === 'string' && UUID_RE.test(projectId)
          ? await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
          : [];
      if (!p) errors.projectId = 'invalid';
    }
    if (Object.keys(errors).length) return { errors };
    return {
      fields: { title, startsAt: startsAt!, endsAt: endsAt!, allDay, location, description, kind: kind as EventKind | null, projectId: projectId as string | null },
    };
  }

  async function current(id: string) {
    if (!UUID_RE.test(id)) return null;
    const [row] = await db.select().from(events).where(and(eq(events.id, id), isNull(events.deletedAt)));
    return row ?? null;
  }

  // Agenda numa leitura só: sincroniza com o Google, se já for a hora, e devolve os eventos do período.
  app.get<{ Querystring: { from?: string; to?: string; retry?: string } }>(
    '/events',
    { config: { permission: 'workspace.read' } },
    async (request, reply) => {
      const from = instant(request.query.from);
      const to = instant(request.query.to);
      if (!from || !to || to <= from || to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
        return reply.code(400).send({ error: 'validation', fields: { range: 'invalid' } });
      }
      const calendar = await sync.sync({ retry: request.query.retry === '1' });
      const rows = await db
        .select({ e: events, projectName: projects.name })
        .from(events)
        .leftJoin(projects, eq(projects.id, events.projectId))
        .where(and(isNull(events.deletedAt), lt(events.startsAt, to), gt(events.endsAt, from)))
        .orderBy(asc(events.startsAt), asc(events.title));
      const conflicts = await recentConflicts(rows.map((r) => r.e.id));
      return { events: rows.map((r) => toDto(r.e, r.projectName, conflicts.get(r.e.id) ?? null)), calendar };
    },
  );

  app.post<{ Body: Record<string, unknown> }>('/events', { config: { permission: 'events.write' } }, async (request, reply) => {
    const parsed = await parse(request.body);
    if ('errors' in parsed) return reply.code(400).send({ error: 'validation', fields: parsed.errors });
    const actor = request.user!;
    const created = await db.transaction(async (tx) => {
      const [e] = await tx
        .insert(events)
        .values({ ...parsed.fields, source: 'erp', createdBy: actor.id, updatedAt: new Date(), syncStatus: 'pending' })
        .returning();
      await audit(tx, { userId: actor.id, action: 'event.create', entity: 'event', entityId: e.id, payload: { title: e.title, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt.toISOString() } });
      return e;
    });
    // Vai para o Google na hora. Se falhar, fica pendente e a próxima sincronização reenvia.
    await sync.push(created.id);
    return reply.code(201).send(await dto(created.id));
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/events/:id',
    { config: { permission: 'events.write' } },
    async (request, reply) => {
      const before = await current(request.params.id);
      if (!before) return reply.code(404).send({ error: 'not_found' });
      if (before.recurringEventId) return reply.code(409).send({ error: 'recurring' });
      const parsed = await parse(request.body);
      if ('errors' in parsed) return reply.code(400).send({ error: 'validation', fields: parsed.errors });
      const actor = request.user!;
      await db.transaction(async (tx) => {
        // updatedAt é o horário em que a pessoa salvou: é ele que decide um conflito com o Google.
        await tx.update(events).set({ ...parsed.fields, updatedAt: new Date(), syncStatus: 'pending', syncError: null, syncAttempts: 0 }).where(eq(events.id, before.id));
        await audit(tx, {
          userId: actor.id,
          action: 'event.update',
          entity: 'event',
          entityId: before.id,
          payload: {
            from: { title: before.title, startsAt: before.startsAt.toISOString(), endsAt: before.endsAt.toISOString(), allDay: before.allDay, location: before.location, description: before.description, kind: before.kind, projectId: before.projectId },
            to: { ...parsed.fields, startsAt: parsed.fields.startsAt.toISOString(), endsAt: parsed.fields.endsAt.toISOString() },
          },
        });
      });
      await sync.push(before.id);
      return dto(before.id);
    },
  );

  // Remoção lógica no ERP; no Google, o evento vai para a lixeira.
  app.delete<{ Params: { id: string } }>('/events/:id', { config: { permission: 'events.write' } }, async (request, reply) => {
    const before = await current(request.params.id);
    if (!before) return reply.code(404).send({ error: 'not_found' });
    if (before.recurringEventId) return reply.code(409).send({ error: 'recurring' });
    const actor = request.user!;
    await db.transaction(async (tx) => {
      await tx.update(events).set({ deletedAt: new Date(), updatedAt: new Date(), syncStatus: 'pending', syncError: null, syncAttempts: 0 }).where(eq(events.id, before.id));
      await audit(tx, { userId: actor.id, action: 'event.delete', entity: 'event', entityId: before.id, payload: { title: before.title, startsAt: before.startsAt.toISOString() } });
    });
    await sync.push(before.id);
    return reply.code(204).send();
  });

  // Conectar e desconectar o calendário "De.Croqui ERP": só a administração (o token é do administrador).
  app.post('/calendar/connect', { config: { permission: 'calendar.connect' } }, async (request, reply) => {
    try {
      return await sync.connect(request.user!.id);
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'falha ao conectar o Google Agenda');
      // Token vencido ou ausente: só entrando de novo com o Google.
      if (err instanceof CalendarError && err.reconnect) return reply.code(409).send({ error: 'reconnect' });
      return reply.code(502).send({ error: 'calendar_unavailable' });
    }
  });

  app.post('/calendar/disconnect', { config: { permission: 'calendar.connect' } }, async (request) => sync.disconnect(request.user!.id));
}
