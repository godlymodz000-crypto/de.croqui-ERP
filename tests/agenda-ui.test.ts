// Fase 5, lado da tela: datas da Agenda, eventos lado a lado, textos da conexão e do evento, formulário,
// permissões na tela e o cache do período (uma leitura; gravar não busca de novo; erro volta a buscar).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from '../src/api/http';
import { eventsApi, type AgendaEvent, type AgendaPage, type CalendarInfo } from '../src/api/events';
import { layoutDay, periodLabel, shiftAnchor, timeRange, viewRange, eventsOnDay } from '../src/pages/agenda/dates';
import {
  canEditEvent,
  canWriteEvents,
  conflictNote,
  connectionNotice,
  emptyForm,
  formFrom,
  formToInput,
  kindLabel,
  originLine,
  originTag,
  withEvent,
  withoutEvent,
} from '../src/pages/agenda/agenda';

// Datas no fuso de quem roda o teste, como a tela usa o fuso do navegador.
const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const ev = (over: Partial<AgendaEvent> = {}): AgendaEvent => ({
  id: 'e1',
  title: 'Medição da casa',
  startsAt: d(2026, 11, 3, 9).toISOString(),
  endsAt: d(2026, 11, 3, 11).toISOString(),
  allDay: false,
  location: null,
  description: null,
  kind: 'site_visit',
  projectId: null,
  projectName: null,
  source: 'google',
  syncStatus: 'synced',
  recurring: false,
  googleUrl: null,
  conflict: null,
  ...over,
});
const connected: CalendarInfo = { status: 'connected', lastSyncedAt: d(2026, 11, 3, 14, 32).toISOString(), error: false, pending: 0 };
const user = (role: 'admin' | 'member' | 'viewer') => ({ id: 'u', email: 'x@decroqui.test', name: 'X', role });

describe('datas', () => {
  it('a semana vai de domingo a sábado; o mês é a grade de 6 semanas; o dia é o próprio dia', () => {
    expect(viewRange('week', d(2026, 11, 3))).toEqual({ from: d(2026, 11, 1), to: d(2026, 11, 8) });
    expect(viewRange('list', d(2026, 11, 3))).toEqual({ from: d(2026, 11, 1), to: d(2026, 11, 8) });
    expect(viewRange('month', d(2026, 11, 20))).toEqual({ from: d(2026, 11, 1), to: d(2026, 12, 13) });
    expect(viewRange('day', d(2026, 11, 3, 15))).toEqual({ from: d(2026, 11, 3), to: d(2026, 11, 4) });
  });

  it('textos do período, como nos quadros', () => {
    expect(periodLabel('week', d(2026, 11, 3))).toBe('1 a 7 de novembro de 2026');
    expect(periodLabel('week', d(2026, 12, 1))).toBe('29 de novembro a 5 de dezembro de 2026');
    expect(periodLabel('week', d(2026, 12, 30))).toBe('27 de dezembro de 2026 a 2 de janeiro de 2027');
    expect(periodLabel('week', d(2026, 11, 3), true)).toBe('1 a 7 de nov.');
    expect(periodLabel('day', d(2026, 11, 3))).toBe('Terça, 3 de novembro de 2026');
    expect(periodLabel('month', d(2026, 11, 3))).toBe('Novembro de 2026');
  });

  it('anterior e próximo andam um dia, uma semana ou um mês', () => {
    expect(shiftAnchor('day', d(2026, 11, 3), 1)).toEqual(d(2026, 11, 4));
    expect(shiftAnchor('week', d(2026, 11, 3), -1)).toEqual(d(2026, 10, 25));
    expect(shiftAnchor('month', d(2026, 12, 15), 1)).toEqual(d(2027, 1, 1));
  });

  it('horário como nos quadros: "9h – 11h", "8h30 – 10h30" e "Dia inteiro"', () => {
    expect(timeRange(ev())).toBe('9h – 11h');
    expect(timeRange(ev({ startsAt: d(2026, 11, 5, 8, 30).toISOString(), endsAt: d(2026, 11, 5, 10, 30).toISOString() }))).toBe('8h30 – 10h30');
    expect(timeRange(ev({ allDay: true }))).toBe('Dia inteiro');
  });

  it('evento que atravessa a meia-noite aparece nos dois dias', () => {
    const night = ev({ startsAt: d(2026, 11, 3, 22).toISOString(), endsAt: d(2026, 11, 4, 2).toISOString() });
    expect(eventsOnDay([night], d(2026, 11, 3))).toHaveLength(1);
    expect(eventsOnDay([night], d(2026, 11, 4))).toHaveLength(1);
    expect(eventsOnDay([night], d(2026, 11, 5))).toHaveLength(0);
  });

  it('eventos sobrepostos ficam lado a lado; os que não se tocam usam a largura toda', () => {
    const a = ev({ id: 'a', startsAt: d(2026, 11, 3, 9).toISOString(), endsAt: d(2026, 11, 3, 11).toISOString() });
    const b = ev({ id: 'b', startsAt: d(2026, 11, 3, 10).toISOString(), endsAt: d(2026, 11, 3, 12).toISOString() });
    const c = ev({ id: 'c', startsAt: d(2026, 11, 3, 14).toISOString(), endsAt: d(2026, 11, 3, 15).toISOString() });
    const placed = layoutDay([c, b, a], d(2026, 11, 3));
    const by = (id: string) => placed.find((p) => p.event.id === id)!;
    expect([by('a').lane, by('a').lanes, by('b').lane, by('b').lanes]).toEqual([0, 2, 1, 2]);
    expect([by('c').lane, by('c').lanes, by('c').start, by('c').end]).toEqual([0, 1, 14 * 60, 15 * 60]);
  });
});

describe('textos da Agenda', () => {
  it('tipo do evento; o do Google sem marca é "Sem tipo"', () => {
    expect(kindLabel('client_meeting')).toBe('Reunião com cliente');
    expect(kindLabel(null)).toBe('Sem tipo');
  });

  it('etiqueta e linha de origem: pendente e erro avisam, sincronizado diz de onde veio', () => {
    expect(originTag(ev())).toEqual({ text: 'Google', pending: false });
    expect(originTag(ev({ source: 'erp', syncStatus: 'pending' }))).toEqual({ text: 'Pendente', pending: true });
    expect(originLine(ev({ syncStatus: 'pending' }), connected)).toEqual({ text: 'Ainda não enviado ao Google · tentaremos de novo', tone: 'danger' });
    expect(originLine(ev({ syncStatus: 'pending' }), { ...connected, status: 'disconnected' }).text).toBe('Fica só no ERP até o Google Agenda ser conectado');
    expect(originLine(ev({ recurring: true }), connected).text).toBe('Série do Google · só muda no Google Agenda');
    expect(originLine(ev({ source: 'erp' }), connected).text).toBe('Criado no ERP');
  });

  it('conflito recente explica qual versão ficou', () => {
    const now = d(2026, 11, 3, 15);
    expect(conflictNote(ev({ conflict: { winner: 'google', at: d(2026, 11, 3, 9, 20).toISOString() } }), now)).toBe(
      'Alterado no ERP e no Google ao mesmo tempo. Ficou a versão salva por último, do Google, hoje às 9h20. A outra está no histórico.',
    );
    expect(conflictNote(ev(), now)).toBeNull();
  });

  it('conexão: a administração recebe a ação; os outros, só o aviso', () => {
    expect(connectionNotice(connected, true)).toMatchObject({ tone: 'quiet', text: 'Sincronizado com o Google Agenda às 14h32', action: 'disconnect' });
    expect(connectionNotice(connected, false).action).toBeNull();
    expect(connectionNotice({ ...connected, status: 'disconnected' }, true)).toMatchObject({ action: 'connect', actionLabel: 'Conectar Google Agenda' });
    expect(connectionNotice({ ...connected, status: 'reconnect' }, true)).toMatchObject({ tone: 'danger', action: 'reconnect', actionLabel: 'Reconectar conta Google' });
    expect(connectionNotice({ ...connected, status: 'reconnect' }, false)).toMatchObject({ text: 'A conexão com o Google venceu. Peça à administração para reconectar.', action: null });
    // Erro de sincronização: qualquer pessoa pode pedir "Tentar de novo".
    expect(connectionNotice({ ...connected, error: true }, false)).toMatchObject({ tone: 'danger', action: 'retry' });
  });

  it('textos sem ponto de exclamação', () => {
    const all = [
      ...['connected', 'disconnected', 'reconnect'].flatMap((status) => [true, false].map((admin) => connectionNotice({ ...connected, status: status as CalendarInfo['status'] }, admin).text)),
      originLine(ev({ syncStatus: 'error' }), connected).text,
    ];
    for (const t of all) expect(t).not.toContain('!');
  });
});

describe('permissões na tela', () => {
  it('criar e editar: administração e colaborador; leitor só vê; série não muda pelo ERP', () => {
    expect([canWriteEvents(user('admin')), canWriteEvents(user('member')), canWriteEvents(user('viewer')), canWriteEvents(null)]).toEqual([true, true, false, false]);
    expect(canEditEvent(user('member'), ev())).toBe(true);
    expect(canEditEvent(user('admin'), ev({ recurring: true }))).toBe(false);
    expect(canEditEvent(user('viewer'), ev())).toBe(false);
  });
});

describe('formulário', () => {
  it('evento com horário vira início e fim no fuso do estúdio', () => {
    const r = formToInput({ ...emptyForm(d(2026, 11, 5)), title: '  Apresentação  ', date: '2026-11-05', start: '14:00', end: '15:30', kind: 'client_meeting' });
    expect(r).toEqual({
      input: {
        title: 'Apresentação',
        startsAt: d(2026, 11, 5, 14).toISOString(),
        endsAt: d(2026, 11, 5, 15, 30).toISOString(),
        allDay: false,
        location: null,
        description: null,
        kind: 'client_meeting',
        projectId: null,
      },
    });
  });

  it('dia inteiro termina na meia-noite seguinte ao último dia; editar devolve o mesmo último dia', () => {
    const r = formToInput({ ...emptyForm(d(2026, 11, 4)), title: 'Feriado', allDay: true, date: '2026-11-04', endDate: '2026-11-04' });
    expect('input' in r && [r.input.startsAt, r.input.endsAt]).toEqual([d(2026, 11, 4).toISOString(), d(2026, 11, 5).toISOString()]);
    const back = formFrom(ev({ allDay: true, startsAt: d(2026, 11, 4).toISOString(), endsAt: d(2026, 11, 7).toISOString() }));
    expect([back.date, back.endDate]).toEqual(['2026-11-04', '2026-11-06']);
  });

  it('título vazio e fim antes do início são recusados antes de enviar', () => {
    expect(formToInput({ ...emptyForm(d(2026, 11, 5)), title: ' ', start: '15:00', end: '14:00' })).toEqual({ errors: { title: 'required', endsAt: 'before_start' } });
  });

  it('novo evento começa na próxima hora cheia de hoje, ou às 9h de outro dia', () => {
    expect(emptyForm(d(2026, 11, 3), d(2026, 11, 3, 13, 20))).toMatchObject({ date: '2026-11-03', start: '14:00', end: '15:00' });
    expect(emptyForm(d(2026, 11, 6), d(2026, 11, 3, 13, 20))).toMatchObject({ date: '2026-11-06', start: '09:00', end: '10:00' });
  });
});

describe('mudança local', () => {
  const page: AgendaPage = { events: [ev({ id: 'a' }), ev({ id: 'b', title: 'Outro', startsAt: d(2026, 11, 4, 9).toISOString(), endsAt: d(2026, 11, 4, 10).toISOString() })], calendar: connected };
  const from = d(2026, 11, 1);
  const to = d(2026, 11, 8);

  it('evento salvo entra no período, na ordem; movido para fora do período, sai', () => {
    const early = ev({ id: 'c', title: 'Cedo', startsAt: d(2026, 11, 2, 8).toISOString(), endsAt: d(2026, 11, 2, 9).toISOString() });
    expect(withEvent(page, early, from, to).events.map((e) => e.id)).toEqual(['c', 'a', 'b']);
    const moved = ev({ id: 'a', startsAt: d(2026, 11, 20, 9).toISOString(), endsAt: d(2026, 11, 20, 10).toISOString() });
    expect(withEvent(page, moved, from, to).events.map((e) => e.id)).toEqual(['b']);
    expect(withoutEvent(page, 'b').events.map((e) => e.id)).toEqual(['a']);
  });
});

describe('cache do período', () => {
  let calls: { method: string; url: string }[] = [];
  let failWrite = false;
  const page: AgendaPage = { events: [ev()], calendar: connected };
  const FROM = d(2026, 11, 1).toISOString();
  const TO = d(2026, 11, 8).toISOString();

  beforeEach(() => {
    clearCache();
    calls = [];
    failWrite = false;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ method, url });
      if (method !== 'GET') {
        if (failWrite) return new Response('{"error":"unknown"}', { status: 500 });
        return new Response(JSON.stringify(ev({ id: 'novo', title: 'Novo' })), { status: method === 'POST' ? 201 : 200 });
      }
      return new Response(JSON.stringify(page), { status: 200 });
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  const reads = () => calls.filter((c) => c.method === 'GET' && c.url.startsWith('/api/events?')).length;
  const input = { title: 'Novo', startsAt: FROM, endsAt: TO, allDay: false, location: null, description: null, kind: null, projectId: null };

  it('uma leitura traz o período; voltar ao mesmo período usa o cache', async () => {
    await eventsApi.range(FROM, TO);
    await eventsApi.range(FROM, TO);
    expect(reads()).toBe(1);
  });

  it('criar não busca de novo: a tela guarda o período já com o evento', async () => {
    const first = await eventsApi.range(FROM, TO);
    const saved = await eventsApi.create(input);
    eventsApi.remember(FROM, TO, withEvent(first, saved, new Date(FROM), new Date(TO)));
    const again = await eventsApi.range(FROM, TO);
    expect(reads()).toBe(1);
    expect(again.events.map((e) => e.id)).toContain('novo');
  });

  it('a leitura periódica e o "Tentar de novo" buscam de novo; o retry vai ao servidor com retry=1', async () => {
    await eventsApi.range(FROM, TO);
    await eventsApi.range(FROM, TO, { force: true });
    await eventsApi.range(FROM, TO, { retry: true });
    expect(reads()).toBe(3);
    expect(calls.at(-1)!.url).toContain('retry=1');
  });

  it('erro ao gravar: o período guardado é esquecido e a tela busca de novo', async () => {
    await eventsApi.range(FROM, TO);
    failWrite = true;
    await expect(eventsApi.update('e1', input)).rejects.toMatchObject({ status: 500 });
    await eventsApi.range(FROM, TO);
    expect(reads()).toBe(2);
  });
});
