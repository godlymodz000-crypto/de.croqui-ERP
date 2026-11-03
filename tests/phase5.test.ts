// Testes da Fase 5 (ESPECIFICACAO.md, seções 4, 5, 8 e 12, e as decisões de 3/11/2026): Agenda com
// sincronização de duas vias. Banco em memória (PGlite) e Google Agenda simulado (FakeCalendar):
// nenhum teste fala com o Google de verdade.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { asc, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { encrypt, randomToken } from '../api/_app/crypto.js';
import { CalendarError, createAdminCalendar, googleIdFor } from '../api/_app/calendar.js';
import { FakeCalendar } from './fake-calendar.js';
import { FakeDrive } from './fake-drive.js';

const ADMIN_EMAIL = 'admin@decroqui.test';
const config: Config = {
  databaseUrl: 'pglite://memory',
  googleClientId: 'test',
  googleClientSecret: 'test',
  googleRedirectUri: 'http://localhost:3001/auth/google/callback',
  sessionSecret: randomToken(32),
  adminEmail: ADMIN_EMAIL,
  tokenEncryptionKey: Buffer.alloc(32, 7),
  appUrl: 'http://localhost:5173',
  secureCookies: false,
};

let db: Db;
let app: FastifyInstance;
let google: FakeCalendar;
type Headers = { cookie: string };
let admin: Headers;
let adminId: string;
let member: Headers;
let viewer: Headers;

const RANGE = 'from=2026-11-01T03:00:00.000Z&to=2026-11-08T03:00:00.000Z';
const meeting = {
  title: 'Apresentação do executivo',
  startsAt: '2026-11-05T17:00:00.000Z',
  endsAt: '2026-11-05T18:30:00.000Z',
  location: 'Rua Harmonia, 120',
  kind: 'client_meeting',
};

async function login(userId: string): Promise<Headers> {
  const { token } = await createSession(db, userId);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

async function person(role: 'member' | 'viewer') {
  const [u] = await db.insert(schema.users).values({ email: `${role}@decroqui.test`, name: role, role, status: 'active' }).returning();
  return login(u.id);
}

async function connect() {
  const res = await app.inject({ method: 'POST', url: '/calendar/connect', headers: admin });
  expect(res.statusCode).toBe(200);
  return [...google.calendars.keys()][0];
}

/** Faz de conta que a última consulta ao Google foi há muito tempo: a próxima leitura sincroniza. */
async function due() {
  await db.update(schema.calendarSyncState).set({ lastAttemptAt: new Date(Date.now() - 3_600_000) });
}

async function agenda(headers: Headers = viewer, query = RANGE) {
  const res = await app.inject({ method: 'GET', url: `/events?${query}`, headers });
  expect(res.statusCode).toBe(200);
  return res.json() as { events: { id: string; title: string; source: string; syncStatus: string; kind: string | null; allDay: boolean; startsAt: string; recurring: boolean }[]; calendar: { status: string; error: boolean; pending: number } };
}

async function create(body: Record<string, unknown> = meeting, headers: Headers = member) {
  return app.inject({ method: 'POST', url: '/events', headers, payload: body });
}

async function row(id: string) {
  const [e] = await db.select().from(schema.events).where(eq(schema.events.id, id));
  return e;
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action)).orderBy(asc(schema.auditLog.at));
}

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  google = new FakeCalendar();
  app = await buildApp({ config, db, drive: new FakeDrive(), calendar: google });
  const [a] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  adminId = a.id;
  admin = await login(a.id);
  member = await person('member');
  viewer = await person('viewer');
});

afterEach(async () => {
  await app.close();
});

describe('conexão com o Google Agenda', () => {
  it('conectar cria o calendário "De.Croqui ERP" na conta do administrador; conectar de novo usa o mesmo', async () => {
    const calendarId = await connect();
    expect(google.calendars.get(calendarId)).toBe('De.Croqui ERP');
    await connect();
    expect(google.calendars.size).toBe(1);
    expect((await agenda()).calendar.status).toBe('connected');
    expect(await auditRows('calendar.connect')).toHaveLength(2);
  });

  it('sem conexão, a Agenda funciona e os eventos esperam na fila; ao conectar, vão para o Google', async () => {
    expect((await agenda()).calendar).toMatchObject({ status: 'disconnected', pending: 0 });
    const res = await create();
    expect(res.statusCode).toBe(201);
    expect(res.json().syncStatus).toBe('pending');
    expect(google.calls).toEqual([]);
    const calendarId = await connect();
    const sent = google.events.get(googleIdFor(res.json().id))!;
    expect(sent.calendarId).toBe(calendarId);
    expect((await row(res.json().id)).syncStatus).toBe('synced');
  });

  it('desconectar para a sincronização e esquece o calendário, sem revogar o acesso no Google', async () => {
    await connect();
    await db.update(schema.users).set({ googleRefreshToken: encrypt('refresh-de-teste', config.tokenEncryptionKey) }).where(eq(schema.users.id, adminId));
    const created = (await create()).json();
    const res = await app.inject({ method: 'POST', url: '/calendar/disconnect', headers: admin });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('disconnected');
    expect(await db.select().from(schema.calendarSyncState)).toEqual([]);
    // O refresh token continua guardado (o Drive usa o mesmo) e o evento continua no ERP.
    const [a] = await db.select().from(schema.users).where(eq(schema.users.id, adminId));
    expect(a.googleRefreshToken).toBeTruthy();
    expect((await agenda()).events.map((e) => e.id)).toEqual([created.id]);
    // Sem conexão, nada vai ao Google.
    const calls = google.calls.length;
    await create({ ...meeting, title: 'Depois de desconectar' });
    await due();
    await agenda();
    expect(google.calls.length).toBe(calls);
    expect(await auditRows('calendar.disconnect')).toHaveLength(1);
  });

  it('token vencido: a Agenda avisa para reconectar, em vez de falhar em silêncio; ao entrar de novo, volta', async () => {
    await connect();
    await due();
    google.fail('*', { reconnect: true });
    expect((await agenda()).calendar.status).toBe('reconnect');
    // O administrador entrou de novo: a próxima leitura já confere, sem esperar os 2 minutos.
    expect((await agenda()).calendar).toMatchObject({ status: 'connected', error: false });
  });

  it('só a administração conecta e desconecta', async () => {
    for (const headers of [member, viewer]) {
      expect((await app.inject({ method: 'POST', url: '/calendar/connect', headers })).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: '/calendar/disconnect', headers })).statusCode).toBe(403);
    }
    expect(google.calls).toEqual([]);
  });

  it('cliente real: token recusado pelo Google pede reconexão; nada envia convite e a alteração leva o etag', async () => {
    await db.update(schema.users).set({ googleRefreshToken: encrypt('refresh-de-teste', config.tokenEncryptionKey) }).where(eq(schema.users.id, adminId));
    const requests: { url: string; init?: RequestInit }[] = [];
    let tokenOk = false;
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      if (url.startsWith('https://oauth2.googleapis.com/token')) {
        return tokenOk
          ? new Response(JSON.stringify({ access_token: 'acesso', expires_in: 3600 }), { status: 200 })
          : new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
      }
      return new Response(JSON.stringify({ id: 'x', etag: '"2"', status: 'confirmed', updated: new Date().toISOString() }), { status: 200 });
    }) as typeof fetch;
    const client = createAdminCalendar({ config, db, fetch: fakeFetch });
    const body = { summary: 'A', location: '', description: '', start: { date: '2026-11-05' }, end: { date: '2026-11-06' }, extendedProperties: { private: {} } };
    await expect(client.insert('cal', body)).rejects.toMatchObject({ reconnect: true });
    tokenOk = true;
    await client.insert('cal', body);
    await client.patch('cal', 'x', body, '"1"');
    await client.remove('cal', 'x');
    const calendarCalls = requests.filter((r) => r.url.includes('/calendar/v3/'));
    expect(calendarCalls).toHaveLength(3);
    for (const r of calendarCalls) expect(r.url).toContain('sendUpdates=none');
    expect((calendarCalls[1].init?.headers as Record<string, string>)['if-match']).toBe('"1"');
    for (const r of calendarCalls) expect(String(r.init?.body ?? '')).not.toContain('attendees');
  });
});

describe('ERP para o Google', () => {
  beforeEach(connect);

  it('evento criado no ERP vai para o Google na hora, com o tipo como propriedade privada e sem participantes', async () => {
    const res = await create();
    expect(res.statusCode).toBe(201);
    const e = res.json();
    expect(e).toMatchObject({ title: meeting.title, kind: 'client_meeting', source: 'erp', syncStatus: 'synced' });
    const g = google.events.get(googleIdFor(e.id))!;
    expect(g).toMatchObject({
      summary: meeting.title,
      location: meeting.location,
      start: { dateTime: meeting.startsAt, timeZone: 'America/Sao_Paulo' },
      extendedProperties: { private: { erpId: e.id, kind: 'client_meeting' } },
    });
    expect(g).not.toHaveProperty('attendees');
    // Link para abrir no Google Agenda: ID do evento e do calendário em base64.
    const eid = new URL(e.googleUrl).searchParams.get('eid')!;
    expect(Buffer.from(eid, 'base64').toString()).toBe(`${g.id} ${g.calendarId}`);
    expect(e.conflict).toBeNull();
    const r = await row(e.id);
    expect(r.googleEventId).toBe(g.id);
    expect(r.googleEtag).toBe(g.etag);
    const [entry] = await auditRows('event.create');
    expect(entry).toMatchObject({ entity: 'event', entityId: e.id });
    expect(entry.userId).not.toBeNull();
  });

  it('editar no ERP altera no Google usando o etag; remover manda para a lixeira do Google e é exclusão lógica', async () => {
    const e = (await create()).json();
    const res = await app.inject({ method: 'PATCH', url: `/events/${e.id}`, headers: member, payload: { ...meeting, title: 'Executivo revisado' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().syncStatus).toBe('synced');
    expect(google.events.get(googleIdFor(e.id))!.summary).toBe('Executivo revisado');
    expect((await app.inject({ method: 'DELETE', url: `/events/${e.id}`, headers: member })).statusCode).toBe(204);
    expect(google.events.get(googleIdFor(e.id))!.status).toBe('cancelled');
    const r = await row(e.id);
    expect(r.deletedAt).not.toBeNull();
    expect(r.syncStatus).toBe('synced');
    expect((await agenda()).events).toEqual([]);
    expect((await auditRows('event.update'))[0].payload).toMatchObject({ from: { title: meeting.title }, to: { title: 'Executivo revisado' } });
    expect(await auditRows('event.delete')).toHaveLength(1);
  });

  it('dia inteiro: vai como data, no fuso de São Paulo', async () => {
    const e = (await create({ title: 'Entrega das cadeiras', allDay: true, startsAt: '2026-11-04T15:00:00.000Z', endsAt: '2026-11-05T15:00:00.000Z', kind: 'delivery' })).json();
    expect(e).toMatchObject({ allDay: true, startsAt: '2026-11-04T03:00:00.000Z', endsAt: '2026-11-05T03:00:00.000Z' });
    expect(google.events.get(googleIdFor(e.id))).toMatchObject({ start: { date: '2026-11-04' }, end: { date: '2026-11-05' } });
  });

  it('falha de rede deixa o evento pendente; a próxima sincronização reenvia', async () => {
    google.fail('insert');
    const e = (await create()).json();
    expect(e.syncStatus).toBe('pending');
    expect(await row(e.id)).toMatchObject({ syncStatus: 'pending', syncAttempts: 1 });
    expect((await agenda()).calendar.pending).toBe(1);
    await due();
    const after = await agenda();
    expect(after.calendar.pending).toBe(0);
    expect(after.events[0].syncStatus).toBe('synced');
    expect(google.events.get(googleIdFor(e.id))!.summary).toBe(meeting.title);
  });

  it('sincronização parcial: um envio falha, os outros seguem; o que falhou vai na tentativa seguinte', async () => {
    google.fail('insert', { times: 3 });
    const a = (await create({ ...meeting, title: 'Primeiro' })).json();
    const b = (await create({ ...meeting, title: 'Segundo' })).json();
    const c = (await create({ ...meeting, title: 'Terceiro' })).json();
    // Na sincronização, a primeira tentativa (do mais antigo) ainda falha; os outros dois vão.
    google.fail('insert');
    await due();
    await agenda();
    expect((await row(a.id)).syncStatus).toBe('pending');
    expect((await row(b.id)).syncStatus).toBe('synced');
    expect((await row(c.id)).syncStatus).toBe('synced');
    await due();
    await agenda();
    expect((await row(a.id)).syncStatus).toBe('synced');
    expect([...google.events.values()].map((g) => g.summary).sort()).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });

  it('resposta da criação perdida: reenviar não duplica o evento no Google', async () => {
    const e = (await create()).json();
    // Simula a resposta perdida: o ERP não guardou o ID do Google.
    await db.update(schema.events).set({ googleEventId: null, googleEtag: null, syncStatus: 'pending' }).where(eq(schema.events.id, e.id));
    await due();
    await agenda();
    expect(google.events.size).toBe(1);
    expect((await row(e.id)).syncStatus).toBe('synced');
    expect(await auditRows('event.conflict')).toEqual([]);
  });

  it('o Google recusa os dados: o evento fica com erro e não é reenviado em toda sincronização', async () => {
    google.fail('insert', { status: 400 });
    const e = (await create()).json();
    expect(e.syncStatus).toBe('error');
    await due();
    await agenda();
    expect(google.calls.filter((c) => c === 'insert')).toHaveLength(1);
  });
});

describe('Google para o ERP', () => {
  let calendarId: string;
  beforeEach(async () => {
    calendarId = await connect();
  });

  it('evento criado no Google entra no ERP, sem tipo; alteração e remoção no Google também chegam', async () => {
    const gid = google.googleCreate(calendarId, { summary: 'Medição da casa', location: 'Granja Viana' });
    await due();
    let body = await agenda();
    expect(body.events).toHaveLength(1);
    expect(body.events[0]).toMatchObject({ title: 'Medição da casa', source: 'google', kind: null, syncStatus: 'synced' });
    const [created] = await auditRows('event.google_create');
    expect(created.userId).toBeNull();

    google.googleEdit(gid, { summary: 'Medição da casa (nova data)', start: { dateTime: '2026-11-06T12:00:00.000Z' }, end: { dateTime: '2026-11-06T14:00:00.000Z' } });
    await due();
    body = await agenda();
    expect(body.events[0]).toMatchObject({ title: 'Medição da casa (nova data)', startsAt: '2026-11-06T12:00:00.000Z' });
    expect((await auditRows('event.google_update'))[0].payload).toMatchObject({ from: { title: 'Medição da casa' }, to: { title: 'Medição da casa (nova data)' } });

    google.googleDelete(gid);
    await due();
    expect((await agenda()).events).toEqual([]);
    expect(await auditRows('event.google_delete')).toHaveLength(1);
  });

  it('a própria alteração do ERP voltando na leitura não vira alteração nem conflito', async () => {
    await create();
    await due();
    await agenda();
    expect(await auditRows('event.google_update')).toEqual([]);
    expect(await auditRows('event.conflict')).toEqual([]);
  });

  it('no máximo uma consulta ao Google a cada 2 minutos, para todos', async () => {
    google.googleCreate(calendarId, { summary: 'Um' });
    google.calls = [];
    await due();
    await Promise.all([agenda(viewer), agenda(member), agenda(admin)]);
    await agenda(viewer);
    expect(google.calls.filter((c) => c === 'list')).toHaveLength(1);
  });

  it('erro na leitura: a Agenda mostra os eventos do banco e o erro; "Tentar de novo" consulta na hora', async () => {
    await create();
    google.fail('list');
    await due();
    const body = await agenda();
    expect(body.calendar.error).toBe(true);
    expect(body.events).toHaveLength(1);
    // Sem "Tentar de novo", a espera de 2 minutos vale.
    expect((await agenda()).calendar.error).toBe(true);
    await db.update(schema.calendarSyncState).set({ lastAttemptAt: new Date(Date.now() - 15_000) });
    expect((await agenda(viewer, `${RANGE}&retry=1`)).calendar.error).toBe(false);
  });

  it('syncToken vencido (410): faz a leitura completa e recomeça', async () => {
    const gid = google.googleCreate(calendarId, { summary: 'Antes' });
    await due();
    await agenda();
    google.googleEdit(gid, { summary: 'Depois' });
    google.purge(google.googleCreate(calendarId, { summary: 'Apagado de vez' }));
    google.minToken = Number.MAX_SAFE_INTEGER;
    await due();
    const body = await agenda();
    google.minToken = 0;
    expect(body.events.map((e) => e.title)).toEqual(['Depois']);
    expect(body.calendar.error).toBe(false);
    // Evento que sumiu do Google sem passar pela leitura incremental também sai do ERP.
    const lost = google.googleCreate(calendarId, { summary: 'Vai sumir' });
    await due();
    await agenda();
    google.purge(lost);
    google.minToken = Number.MAX_SAFE_INTEGER;
    await due();
    const after = await agenda();
    google.minToken = 0;
    expect(after.events.map((e) => e.title)).toEqual(['Depois']);
  });

  it('dia inteiro e ocorrências de série: aparecem; a série não é editada nem removida pelo ERP', async () => {
    google.googleCreate(calendarId, { summary: 'Feriado', start: { date: '2026-11-02' }, end: { date: '2026-11-03' } });
    google.googleCreate(calendarId, { summary: 'Reunião semanal', recurringEventId: 'serie-1' });
    await due();
    const body = await agenda();
    const allDay = body.events.find((e) => e.title === 'Feriado')!;
    expect(allDay).toMatchObject({ allDay: true, startsAt: '2026-11-02T03:00:00.000Z' });
    const occurrence = body.events.find((e) => e.title === 'Reunião semanal')!;
    expect(occurrence.recurring).toBe(true);
    expect((await app.inject({ method: 'PATCH', url: `/events/${occurrence.id}`, headers: member, payload: meeting })).statusCode).toBe(409);
    expect((await app.inject({ method: 'DELETE', url: `/events/${occurrence.id}`, headers: member })).statusCode).toBe(409);
  });
});

describe('conflito: alteração dos dois lados', () => {
  let eventId: string;
  let gid: string;
  beforeEach(async () => {
    await connect();
    eventId = (await create()).json().id;
    gid = googleIdFor(eventId);
  });

  async function editInErp(title: string, failPush = false) {
    if (failPush) google.fail('patch');
    const res = await app.inject({ method: 'PATCH', url: `/events/${eventId}`, headers: member, payload: { ...meeting, title } });
    expect(res.statusCode).toBe(200);
    return row(eventId);
  }

  it('o Google salvou por último: vence o Google, e a versão do ERP vai para o audit_log', async () => {
    const local = await editInErp('Título do ERP', true);
    google.googleEdit(gid, { summary: 'Título do Google' }, new Date(local.updatedAt.getTime() + 60_000));
    await due();
    const body = await agenda();
    expect(body.events[0].title).toBe('Título do Google');
    // O painel do evento conta que houve conflito e qual lado ficou.
    expect((body.events[0] as unknown as { conflict: { winner: string } }).conflict.winner).toBe('google');
    expect(google.events.get(gid)!.summary).toBe('Título do Google');
    const [c] = await auditRows('event.conflict');
    expect(c.payload).toMatchObject({ winner: 'google', erp: { title: 'Título do ERP' }, google: { title: 'Título do Google' } });
  });

  it('o ERP salvou por último: vence o ERP, o Google recebe a versão do ERP e a dele vai para o audit_log', async () => {
    google.googleEdit(gid, { summary: 'Título do Google' }, new Date(Date.now() - 60_000));
    // O envio leva o etag antigo: o Google recusa (412), o ERP compara os horários e reenvia.
    await editInErp('Título do ERP');
    expect(google.events.get(gid)!.summary).toBe('Título do ERP');
    expect((await row(eventId)).syncStatus).toBe('synced');
    const [c] = await auditRows('event.conflict');
    expect(c.payload).toMatchObject({ winner: 'erp', erp: { title: 'Título do ERP' }, google: { title: 'Título do Google' } });
  });

  it('o ERP salvou por último, mas o envio falhou: na leitura seguinte vence o ERP mesmo assim', async () => {
    google.googleEdit(gid, { summary: 'Título do Google' }, new Date(Date.now() - 60_000));
    await editInErp('Título do ERP', true);
    await due();
    await agenda();
    expect(google.events.get(gid)!.summary).toBe('Título do ERP');
    expect((await auditRows('event.conflict')).map((c) => c.payload.winner)).toEqual(['erp']);
  });

  it('empate exato de horário: vence o Google', async () => {
    const local = await editInErp('Título do ERP', true);
    google.googleEdit(gid, { summary: 'Título do Google' }, local.updatedAt);
    await due();
    expect((await agenda()).events[0].title).toBe('Título do Google');
    expect((await auditRows('event.conflict'))[0].payload.winner).toBe('google');
  });

  it('vale o evento inteiro: o título do ERP e o horário do Google não se misturam', async () => {
    const local = await editInErp('Título do ERP', true);
    google.googleEdit(gid, { start: { dateTime: '2026-11-05T19:00:00.000Z' }, end: { dateTime: '2026-11-05T20:00:00.000Z' } }, new Date(local.updatedAt.getTime() + 1));
    await due();
    const [e] = (await agenda()).events;
    expect(e).toMatchObject({ title: meeting.title, startsAt: '2026-11-05T19:00:00.000Z' });
  });

  it('apagado no Google e editado no ERP: a exclusão vence, e a edição perdida vai para o audit_log', async () => {
    const local = await editInErp('Edição que vai se perder', true);
    google.googleDelete(gid, new Date(local.updatedAt.getTime() - 60_000));
    await due();
    expect((await agenda()).events).toEqual([]);
    expect((await row(eventId)).deletedAt).not.toBeNull();
    const [c] = await auditRows('event.conflict');
    expect(c.payload).toMatchObject({ winner: 'deletion', deletedIn: 'google', lost: { side: 'erp', title: 'Edição que vai se perder' } });
  });

  it('apagado no ERP e editado no Google: a exclusão vence, e o evento sai do Google', async () => {
    google.fail('remove');
    expect((await app.inject({ method: 'DELETE', url: `/events/${eventId}`, headers: member })).statusCode).toBe(204);
    google.googleEdit(gid, { summary: 'Edição no Google' }, new Date(Date.now() + 60_000));
    await due();
    expect((await agenda()).events).toEqual([]);
    expect(google.events.get(gid)!.status).toBe('cancelled');
    const [c] = await auditRows('event.conflict');
    expect(c.payload).toMatchObject({ winner: 'deletion', deletedIn: 'erp', lost: { side: 'google', title: 'Edição no Google' } });
  });
});

describe('permissões e validação', () => {
  beforeEach(connect);

  it('somente leitura não cria, não edita e não remove; nada muda no ERP nem no Google', async () => {
    const e = (await create()).json();
    const calls = google.calls.length;
    const audits = (await db.select().from(schema.auditLog)).length;
    expect((await create(meeting, viewer)).statusCode).toBe(403);
    expect((await app.inject({ method: 'PATCH', url: `/events/${e.id}`, headers: viewer, payload: { ...meeting, title: 'X' } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'DELETE', url: `/events/${e.id}`, headers: viewer })).statusCode).toBe(403);
    expect(google.calls.length).toBe(calls);
    expect((await db.select().from(schema.auditLog)).length).toBe(audits);
    expect((await row(e.id)).title).toBe(meeting.title);
    // Mas vê a Agenda.
    expect((await agenda(viewer)).events).toHaveLength(1);
  });

  it('sem sessão, a Agenda responde 401', async () => {
    expect((await app.inject({ method: 'GET', url: `/events?${RANGE}` })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/events', payload: meeting })).statusCode).toBe(401);
  });

  it('administração e colaborador criam e editam', async () => {
    expect((await create(meeting, admin)).statusCode).toBe(201);
    expect((await create(meeting, member)).statusCode).toBe(201);
  });

  it('valida título, horários, tipo, projeto e o período da leitura', async () => {
    const res = await create({ title: ' ', startsAt: '2026-11-05T18:00:00.000Z', endsAt: '2026-11-05T17:00:00.000Z', kind: 'festa', projectId: '00000000-0000-0000-0000-000000000000' });
    expect(res.statusCode).toBe(400);
    expect(res.json().fields).toEqual({ title: 'required', endsAt: 'before_start', kind: 'invalid', projectId: 'invalid' });
    expect((await app.inject({ method: 'GET', url: '/events?from=2026-01-01T00:00:00Z&to=2026-12-31T00:00:00Z', headers: viewer })).statusCode).toBe(400);
    expect(await db.select().from(schema.events)).toEqual([]);
  });

  it('evento vinculado a um projeto mostra o nome do projeto', async () => {
    const [stage] = await db.select().from(schema.stages).limit(1);
    const [p] = await db.insert(schema.projects).values({ name: 'Casa Figueira', clientName: 'Teresa', stageId: stage.id, driveFolderId: 'pasta-1' }).returning();
    const e = (await create({ ...meeting, projectId: p.id })).json();
    expect(e).toMatchObject({ projectId: p.id, projectName: 'Casa Figueira' });
  });

  it('o audit_log só recebe linhas: criar, editar, remover e sincronizar não apagam nem alteram as anteriores', async () => {
    const e = (await create()).json();
    const first = await db.select().from(schema.auditLog);
    await app.inject({ method: 'PATCH', url: `/events/${e.id}`, headers: member, payload: { ...meeting, title: 'Outro' } });
    await app.inject({ method: 'DELETE', url: `/events/${e.id}`, headers: member });
    await due();
    await agenda();
    const after = await db.select().from(schema.auditLog);
    for (const entry of first) expect(after).toContainEqual(entry);
    expect(after.length).toBeGreaterThan(first.length);
  });
});

describe('cliente simulado', () => {
  it('a falha simulada é um CalendarError, como a do cliente real', async () => {
    const g = new FakeCalendar();
    g.fail('list', { status: 503 });
    await expect(g.list('c', {})).rejects.toBeInstanceOf(CalendarError);
  });
});
