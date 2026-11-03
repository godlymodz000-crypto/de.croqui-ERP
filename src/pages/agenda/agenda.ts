import type { AgendaEvent, AgendaPage, CalendarInfo, EventInput, EventKind } from '../../api/events';
import type { SessionUser } from '../../session';
import { addDays, dateInput, fromInputs, hourLabel, sameDay, startOfDay, timeInput } from './dates';

/** Ordem da legenda e do seletor de tipo. Sem tipo é o evento do Google que não tem a marca. */
export const KINDS: { value: EventKind; label: string }[] = [
  { value: 'site_visit', label: 'Visita técnica' },
  { value: 'client_meeting', label: 'Reunião com cliente' },
  { value: 'delivery', label: 'Entrega' },
  { value: 'internal_deadline', label: 'Prazo interno' },
  { value: 'personal', label: 'Pessoal' },
];
export const NO_KIND_LABEL = 'Sem tipo';

export function kindLabel(kind: EventKind | null): string {
  return KINDS.find((k) => k.value === kind)?.label ?? NO_KIND_LABEL;
}

/** Classe de cor do evento (tokens em app.css). */
export function kindClass(kind: EventKind | null): string {
  return `agenda-kind--${kind ?? 'none'}`;
}

/** Criar, editar e remover eventos: events.write (administração e colaborador). */
export function canWriteEvents(user: SessionUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'member';
}

/** Ocorrência de série não muda pelo ERP nesta fase; o resto, quem pode escrever muda. */
export function canEditEvent(user: SessionUser | null, event: AgendaEvent): boolean {
  return canWriteEvents(user) && !event.recurring;
}

/** Etiqueta do evento na grade e na lista: "Pendente" enquanto não foi para o Google. */
export function originTag(e: AgendaEvent): { text: string; pending: boolean } {
  if (e.syncStatus !== 'synced') return { text: e.syncStatus === 'error' ? 'Não enviado' : 'Pendente', pending: true };
  return { text: e.source === 'google' ? 'Google' : 'ERP', pending: false };
}

/** Linha abaixo do título no painel do evento. */
export function originLine(e: AgendaEvent, calendar: CalendarInfo): { text: string; tone: 'muted' | 'danger' } {
  if (e.syncStatus === 'error') return { text: 'O Google recusou este evento. Edite e salve de novo.', tone: 'danger' };
  if (e.syncStatus === 'pending') {
    return calendar.status === 'connected'
      ? { text: 'Ainda não enviado ao Google · tentaremos de novo', tone: 'danger' }
      : { text: 'Fica só no ERP até o Google Agenda ser conectado', tone: 'danger' };
  }
  if (e.recurring) return { text: 'Série do Google · só muda no Google Agenda', tone: 'muted' };
  return { text: e.source === 'google' ? 'Criado no Google Agenda' : 'Criado no ERP', tone: 'muted' };
}

/** Nota do conflito recente no painel do evento. */
export function conflictNote(e: AgendaEvent, now = new Date()): string | null {
  if (!e.conflict) return null;
  const at = new Date(e.conflict.at);
  const when = sameDay(at, now) ? `hoje às ${hourLabel(at)}` : `em ${at.getDate()}/${at.getMonth() + 1} às ${hourLabel(at)}`;
  const side = e.conflict.winner === 'google' ? 'do Google' : 'do ERP';
  return `Alterado no ERP e no Google ao mesmo tempo. Ficou a versão salva por último, ${side}, ${when}. A outra está no histórico.`;
}

/** Aviso da conexão no topo da Agenda. Quem não é da administração recebe o texto sem a ação. */
export interface ConnectionNotice {
  tone: 'neutral' | 'danger' | 'quiet';
  text: string;
  action: 'connect' | 'reconnect' | 'retry' | 'disconnect' | null;
  actionLabel?: string;
}

export function connectionNotice(calendar: CalendarInfo, isAdmin: boolean): ConnectionNotice {
  if (calendar.status === 'disconnected') {
    return isAdmin
      ? { tone: 'neutral', text: 'O Google Agenda não está conectado. Os eventos ficam só no ERP.', action: 'connect', actionLabel: 'Conectar Google Agenda' }
      : { tone: 'neutral', text: 'O Google Agenda não está conectado. Os eventos ficam só no ERP. Peça à administração para conectar.', action: null };
  }
  if (calendar.status === 'reconnect') {
    return isAdmin
      ? { tone: 'danger', text: 'Sua conexão com o Google venceu. Reconecte para voltar a sincronizar.', action: 'reconnect', actionLabel: 'Reconectar conta Google' }
      : { tone: 'danger', text: 'A conexão com o Google venceu. Peça à administração para reconectar.', action: null };
  }
  if (calendar.error) return { tone: 'danger', text: 'Não conseguimos sincronizar com o Google Agenda.', action: 'retry', actionLabel: 'Tentar de novo' };
  const at = calendar.lastSyncedAt ? new Date(calendar.lastSyncedAt) : null;
  const text = at ? `Sincronizado com o Google Agenda às ${hourLabel(at)}` : 'Conectado ao Google Agenda';
  return isAdmin ? { tone: 'quiet', text, action: 'disconnect', actionLabel: 'Desconectar' } : { tone: 'quiet', text, action: null };
}

// ---------- Formulário ----------

export interface EventForm {
  title: string;
  kind: EventKind | '';
  date: string;
  /** Último dia, no dia inteiro (o mesmo dia por padrão). */
  endDate: string;
  allDay: boolean;
  start: string;
  end: string;
  location: string;
  description: string;
  projectId: string;
}

/** Formulário vazio: o dia escolhido (ou hoje), na próxima hora cheia, com uma hora de duração. */
export function emptyForm(day: Date, now = new Date()): EventForm {
  const start = sameDay(day, now) ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.min(now.getHours() + 1, 22)) : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9);
  const end = new Date(start.getTime() + 3_600_000);
  return { title: '', kind: '', date: dateInput(start), endDate: dateInput(start), allDay: false, start: timeInput(start), end: timeInput(end), location: '', description: '', projectId: '' };
}

export function formFrom(e: AgendaEvent): EventForm {
  const s = new Date(e.startsAt);
  const en = new Date(e.endsAt);
  // No dia inteiro, o fim guardado é a meia-noite seguinte ao último dia.
  const lastDay = e.allDay ? addDays(startOfDay(en), -1) : en;
  return {
    title: e.title,
    kind: e.kind ?? '',
    date: dateInput(s),
    endDate: dateInput(lastDay),
    allDay: e.allDay,
    start: timeInput(s),
    end: timeInput(en),
    location: e.location ?? '',
    description: e.description ?? '',
    projectId: e.projectId ?? '',
  };
}

/** Confere o formulário antes de enviar. Devolve o corpo da gravação ou os erros por campo. */
export function formToInput(f: EventForm): { input: EventInput } | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!f.title.trim()) errors.title = 'required';
  else if (f.title.trim().length > 120) errors.title = 'too_long';
  let startsAt: Date | null;
  let endsAt: Date | null;
  if (f.allDay) {
    startsAt = fromInputs(f.date);
    const last = fromInputs(f.endDate || f.date);
    endsAt = last && addDays(last, 1);
  } else {
    startsAt = fromInputs(f.date, f.start);
    endsAt = fromInputs(f.date, f.end);
  }
  if (!startsAt) errors.startsAt = 'invalid';
  else if (!endsAt) errors.endsAt = 'invalid';
  else if (endsAt <= startsAt) errors.endsAt = 'before_start';
  if (Object.keys(errors).length) return { errors };
  return {
    input: {
      title: f.title.trim(),
      startsAt: startsAt!.toISOString(),
      endsAt: endsAt!.toISOString(),
      allDay: f.allDay,
      location: f.location.trim() || null,
      description: f.description.trim() || null,
      kind: f.kind || null,
      projectId: f.projectId || null,
    },
  };
}

export const FIELD_MESSAGES: Record<string, Record<string, string>> = {
  title: { required: 'Informe o título do evento.', too_long: 'Use um título com até 120 caracteres.' },
  startsAt: { invalid: 'Confira a data e o horário de início.' },
  endsAt: { invalid: 'Confira o horário de fim.', before_start: 'O fim precisa ser depois do início.' },
  location: { too_long: 'Use um local com até 200 caracteres.' },
  description: { too_long: 'Use uma descrição com até 2.000 caracteres.' },
  kind: { invalid: 'Escolha um tipo da lista.' },
  projectId: { invalid: 'Esse projeto não existe mais. Escolha outro.' },
};

// ---------- Mudança local ----------

/** Ordem da Agenda, igual à do servidor: começo, depois título. */
export function compareEvents(a: AgendaEvent, b: AgendaEvent): number {
  return a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : a.title.localeCompare(b.title, 'pt-BR');
}

/** A página do período com o evento salvo (novo ou alterado). Fora do período, ele sai da página. */
export function withEvent(page: AgendaPage, e: AgendaEvent, from: Date, to: Date): AgendaPage {
  const inRange = new Date(e.startsAt) < to && new Date(e.endsAt) > from;
  const others = page.events.filter((x) => x.id !== e.id);
  return { ...page, events: inRange ? [...others, e].sort(compareEvents) : others };
}

export function withoutEvent(page: AgendaPage, id: string): AgendaPage {
  return { ...page, events: page.events.filter((x) => x.id !== id) };
}
