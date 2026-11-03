import type { AgendaEvent } from '../../api/events';

/** Dia, semana, mês ou lista (a lista mostra a semana, dia a dia; é a única visão no celular). */
export type AgendaView = 'day' | 'week' | 'month' | 'list';


const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Soma dias no calendário (não em horas: a meia-noite continua meia-noite). */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

/** A semana começa no domingo, como nos quadros da Agenda. */
export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  return addDays(day, -day.getDay());
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Período que a visão mostra. O mês é a grade de 6 semanas, de domingo a sábado. */
export function viewRange(view: AgendaView, anchor: Date): { from: Date; to: Date } {
  if (view === 'day') {
    const from = startOfDay(anchor);
    return { from, to: addDays(from, 1) };
  }
  if (view === 'month') {
    const from = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    return { from, to: addDays(from, 42) };
  }
  const from = startOfWeek(anchor);
  return { from, to: addDays(from, 7) };
}

/** Próximo ou anterior período (`dir` 1 ou -1). */
export function shiftAnchor(view: AgendaView, anchor: Date, dir: number): Date {
  if (view === 'day') return addDays(startOfDay(anchor), dir);
  if (view === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  return addDays(startOfWeek(anchor), 7 * dir);
}

/** "1 a 7 de novembro de 2026", "29 de novembro a 5 de dezembro de 2026", "Terça, 3 de novembro de 2026", "Novembro de 2026". */
export function periodLabel(view: AgendaView, anchor: Date, short = false): string {
  if (view === 'day') return `${WEEKDAYS_LONG[anchor.getDay()]}, ${anchor.getDate()} de ${MONTHS[anchor.getMonth()]} de ${anchor.getFullYear()}`;
  if (view === 'month') {
    const m = MONTHS[anchor.getMonth()];
    return `${m[0].toUpperCase()}${m.slice(1)} de ${anchor.getFullYear()}`;
  }
  const { from } = viewRange(view, anchor);
  const last = addDays(from, 6);
  const month = (d: Date) => (short ? `${MONTHS[d.getMonth()].slice(0, 3)}.` : MONTHS[d.getMonth()]);
  if (short) {
    return from.getMonth() === last.getMonth()
      ? `${from.getDate()} a ${last.getDate()} de ${month(last)}`
      : `${from.getDate()} de ${month(from)} a ${last.getDate()} de ${month(last)}`;
  }
  if (from.getFullYear() !== last.getFullYear()) {
    return `${from.getDate()} de ${month(from)} de ${from.getFullYear()} a ${last.getDate()} de ${month(last)} de ${last.getFullYear()}`;
  }
  return from.getMonth() === last.getMonth()
    ? `${from.getDate()} a ${last.getDate()} de ${month(last)} de ${last.getFullYear()}`
    : `${from.getDate()} de ${month(from)} a ${last.getDate()} de ${month(last)} de ${last.getFullYear()}`;
}

/** "Dom 1" no cabeçalho das colunas e na lista. */
export function dayLabel(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

/** "Terça, 3 de novembro de 2026" no painel do evento. */
export function longDate(d: Date): string {
  return periodLabel('day', d);
}

/** "9h", "8h30", "14h05". */
export function hourLabel(d: Date): string {
  const m = d.getMinutes();
  return `${d.getHours()}h${m ? String(m).padStart(2, '0') : ''}`;
}

/** "9h – 11h" ou "Dia inteiro". */
export function timeRange(e: Pick<AgendaEvent, 'startsAt' | 'endsAt' | 'allDay'>): string {
  if (e.allDay) return 'Dia inteiro';
  return `${hourLabel(new Date(e.startsAt))} – ${hourLabel(new Date(e.endsAt))}`;
}

/** Eventos que acontecem naquele dia (inclusive os que começaram antes ou terminam depois). */
export function eventsOnDay<T extends Pick<AgendaEvent, 'startsAt' | 'endsAt'>>(events: T[], day: Date): T[] {
  const from = startOfDay(day).getTime();
  const to = addDays(startOfDay(day), 1).getTime();
  return events.filter((e) => new Date(e.startsAt).getTime() < to && new Date(e.endsAt).getTime() > from);
}

export interface Placed<T> {
  event: T;
  /** Minutos desde a meia-noite, já cortados ao dia. */
  start: number;
  end: number;
  /** Coluna dentro do dia e quantas colunas o grupo de eventos sobrepostos usa. */
  lane: number;
  lanes: number;
}

/**
 * Posição dos eventos com horário dentro de um dia: eventos que se sobrepõem ficam lado a lado.
 * Cada evento tem pelo menos 30 minutos de altura, para o texto caber.
 */
export function layoutDay<T extends Pick<AgendaEvent, 'startsAt' | 'endsAt'>>(events: T[], day: Date): Placed<T>[] {
  const base = startOfDay(day).getTime();
  const placed = events
    .map((event) => {
      const start = Math.max(0, (new Date(event.startsAt).getTime() - base) / 60_000);
      const end = Math.min(24 * 60, Math.max(start + 30, (new Date(event.endsAt).getTime() - base) / 60_000));
      return { event, start, end, lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let group: Placed<T>[] = [];
  let groupEnd = -1;
  const close = () => {
    const lanes = Math.max(1, ...group.map((p) => p.lane + 1));
    for (const p of group) p.lanes = lanes;
    group = [];
  };
  for (const p of placed) {
    if (p.start >= groupEnd) {
      close();
      groupEnd = -1;
    }
    const used = new Set(group.filter((g) => g.end > p.start).map((g) => g.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    p.lane = lane;
    group.push(p);
    groupEnd = Math.max(groupEnd, p.end);
  }
  close();
  return placed;
}

/** `YYYY-MM-DD` no fuso do navegador (o do estúdio). */
export function dateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** `HH:MM`. */
export function timeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Data e hora do formulário em um instante. Inválido: null. */
export function fromInputs(date: string, time = '00:00'): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2]));
  return Number.isNaN(d.getTime()) ? null : d;
}


