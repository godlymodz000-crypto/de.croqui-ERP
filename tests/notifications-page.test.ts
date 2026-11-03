// Testes da página de Notificações: lista paginada com filtros e comunicados da administração.
// Banco em memória (PGlite) com as migrações, inclusive a 0005, e Drive falso.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import { FakeDrive } from './fake-drive.js';

const ADMIN_EMAIL = 'admin@decroqui.test';
const ROLES = ['admin', 'member', 'viewer'] as const;
type Role = (typeof ROLES)[number];
type Headers = Record<string, string>;

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

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  app = await buildApp({ config, db, drive: new FakeDrive() });
});

afterEach(async () => {
  await app.close();
});

/** Sessão para um papel. `admin` sem e-mail é a conta dona (ADMIN_EMAIL). */
async function as(role: Role, email?: string) {
  let user;
  if (role === 'admin' && !email) {
    [user] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  } else {
    [user] = await db
      .insert(schema.users)
      .values({ email: email ?? `${role}-${randomToken(4)}@decroqui.test`, name: `Pessoa ${role} ${randomToken(2)}`, role, status: 'active' })
      .returning();
  }
  const { token } = await createSession(db, user.id);
  return { user, headers: { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` } as Headers };
}

function inject(method: string, url: string, headers: Headers, payload?: unknown) {
  return app.inject({ method: method as 'GET', url, headers, ...(payload === undefined ? {} : { payload: payload as object }) });
}

async function notificationsOf(userId: string) {
  return db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId));
}

/** Estúdio do quadro: a dona, outra administradora, dois colaboradores e um leitor ativos; um desativado e um convidado. */
async function studio() {
  const admin = await as('admin');
  const other = await as('admin', 'outra-admin@decroqui.test');
  const joao = await as('member', 'joao@decroqui.test');
  const luisa = await as('member', 'luisa@decroqui.test');
  const rafael = await as('viewer', 'rafael@decroqui.test');
  const [off] = await db
    .insert(schema.users)
    .values({ email: 'off@decroqui.test', name: 'Desativado', role: 'member', status: 'disabled' })
    .returning();
  const [invited] = await db
    .insert(schema.users)
    .values({ email: 'camila@decroqui.test', name: 'Camila', role: 'viewer', status: 'invited' })
    .returning();
  return { admin, other, joao, luisa, rafael, off, invited };
}

const MSG = { title: 'Recesso de fim de ano', body: 'O estúdio fecha de 23 de dezembro a 2 de janeiro.' };

async function send(headers: Headers, payload: Record<string, unknown>) {
  return inject('POST', '/broadcasts', headers, { ...MSG, ...payload });
}

describe('Comunicado: cada destino gera o número certo de notificações (aceite)', () => {
  it('"Todos os usuários ativos": todos os ativos, menos quem envia', async () => {
    const s = await studio();
    const res = await send(s.admin.headers, { audience: 'all' });
    expect(res.statusCode).toBe(201);
    expect(res.json().recipientCount).toBe(4);
    for (const who of [s.other, s.joao, s.luisa, s.rafael]) expect(await notificationsOf(who.user.id)).toHaveLength(1);
    expect(await notificationsOf(s.admin.user.id)).toHaveLength(0);
  });

  it('"Só colaboradores" e "Só leitores"', async () => {
    const s = await studio();
    expect((await send(s.admin.headers, { audience: 'members' })).json().recipientCount).toBe(2);
    expect(await notificationsOf(s.joao.user.id)).toHaveLength(1);
    expect(await notificationsOf(s.luisa.user.id)).toHaveLength(1);
    expect(await notificationsOf(s.rafael.user.id)).toHaveLength(0);
    expect((await send(s.admin.headers, { audience: 'viewers' })).json().recipientCount).toBe(1);
    expect(await notificationsOf(s.rafael.user.id)).toHaveLength(1);
    expect(await notificationsOf(s.other.user.id)).toHaveLength(0);
  });

  it('"Pessoas específicas": só as marcadas; quem envia recebe se se marcou', async () => {
    const s = await studio();
    const res = await send(s.admin.headers, { audience: 'people', userIds: [s.joao.user.id, s.luisa.user.id] });
    expect(res.json().recipientCount).toBe(2);
    expect(await notificationsOf(s.admin.user.id)).toHaveLength(0);
    expect(await notificationsOf(s.rafael.user.id)).toHaveLength(0);
    const self = await send(s.admin.headers, { audience: 'people', userIds: [s.admin.user.id, s.joao.user.id] });
    expect(self.json().recipientCount).toBe(2);
    expect(await notificationsOf(s.admin.user.id)).toHaveLength(1);
  });

  it('a notificação traz tipo, texto, link, remetente e o envio a que pertence', async () => {
    const s = await studio();
    const res = await send(s.admin.headers, { audience: 'members', link: { kind: 'page', page: 'agenda' } });
    const [n] = await notificationsOf(s.joao.user.id);
    expect(n).toMatchObject({ type: 'announcement', ...MSG, link: '/agenda', senderUserId: s.admin.user.id, broadcastId: res.json().id, readAt: null });
    const item = (await inject('GET', '/notifications', s.joao.headers)).json().items[0];
    expect(item).toMatchObject({ type: 'announcement', senderName: s.admin.user.name ?? ADMIN_EMAIL, link: '/agenda' });
  });

  it('a contagem do painel bate com o envio: grupos sem quem envia, lista com todos os ativos', async () => {
    const s = await studio();
    const a = (await inject('GET', '/broadcasts/audience', s.admin.headers)).json();
    expect(a.counts).toEqual({ all: 4, members: 2, viewers: 1 });
    expect(a.people).toHaveLength(5);
    expect(a.people.find((p: { me: boolean }) => p.me).id).toBe(s.admin.user.id);
    expect(a.people.map((p: { id: string }) => p.id)).not.toContain(s.off.id);
  });
});

describe('Comunicado: contas inativas não recebem (aceite)', () => {
  it('desativados e convidados ficam de fora de "todos" e dos grupos', async () => {
    const s = await studio();
    await send(s.admin.headers, { audience: 'all' });
    await send(s.admin.headers, { audience: 'members' });
    await send(s.admin.headers, { audience: 'viewers' });
    expect(await notificationsOf(s.off.id)).toHaveLength(0);
    expect(await notificationsOf(s.invited.id)).toHaveLength(0);
  });

  it('marcar uma conta inativa em "Pessoas específicas": 400, ninguém recebe', async () => {
    const s = await studio();
    for (const id of [s.off.id, s.invited.id]) {
      const res = await send(s.admin.headers, { audience: 'people', userIds: [s.joao.user.id, id] });
      expect(res.statusCode).toBe(400);
      expect(res.json().fields).toEqual({ recipients: 'invalid' });
    }
    expect(await notificationsOf(s.joao.user.id)).toHaveLength(0);
  });
});

describe('Comunicado: validação', () => {
  it('título e texto obrigatórios', async () => {
    const s = await studio();
    const res = await inject('POST', '/broadcasts', s.admin.headers, { audience: 'all', title: '  ', body: '' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'validation', fields: { title: 'required', body: 'required' } });
    const long = await send(s.admin.headers, { audience: 'all', title: 'x'.repeat(121) });
    expect(long.json().fields).toEqual({ title: 'too_long' });
  });

  it('pelo menos um destinatário', async () => {
    const s = await studio();
    expect((await send(s.admin.headers, { audience: 'people', userIds: [] })).json().fields).toEqual({ recipients: 'required' });
    expect((await send(s.admin.headers, { audience: 'people' })).json().fields).toEqual({ recipients: 'invalid' });
    expect((await send(s.admin.headers, { audience: 'todos' })).json().fields).toEqual({ audience: 'invalid' });
    await db.update(schema.users).set({ status: 'disabled' }).where(eq(schema.users.id, s.rafael.user.id));
    expect((await send(s.admin.headers, { audience: 'viewers' })).json().fields).toEqual({ recipients: 'none' });
  });

  it('link opcional: projeto que existe ou tela do ERP; telas da administração só para administradores', async () => {
    const s = await studio();
    const project = (await inject('POST', '/projects', s.admin.headers, { name: 'Casa Alecrim', clientName: 'Helena' })).json();
    expect((await send(s.admin.headers, { audience: 'all', link: { kind: 'project', projectId: project.id } })).statusCode).toBe(201);
    expect((await notificationsOf(s.joao.user.id))[0].link).toBe(`/projetos/${project.id}`);
    const bad = [
      { kind: 'project', projectId: '00000000-0000-4000-8000-000000000000' },
      { kind: 'page', page: 'nao-existe' },
      { kind: 'url', href: 'https://exemplo.com' },
    ];
    for (const link of bad) expect((await send(s.admin.headers, { audience: 'all', link })).json().fields).toEqual({ link: 'invalid' });
    const adminPage = { kind: 'page', page: 'pedidos-de-exclusao' };
    expect((await send(s.admin.headers, { audience: 'all', link: adminPage })).json().fields).toEqual({ link: 'admin_only' });
    expect((await send(s.admin.headers, { audience: 'people', userIds: [s.other.user.id], link: adminPage })).statusCode).toBe(201);
  });
});

describe('Só o administrador envia e vê os comunicados enviados (aceite)', () => {
  it('colaborador e leitor: 403 nas três rotas, e nada é enviado', async () => {
    const s = await studio();
    for (const who of [s.joao, s.rafael]) {
      expect((await send(who.headers, { audience: 'all' })).statusCode).toBe(403);
      expect((await inject('GET', '/broadcasts', who.headers)).statusCode).toBe(403);
      expect((await inject('GET', '/broadcasts/audience', who.headers)).statusCode).toBe(403);
    }
    expect(await db.select().from(schema.broadcasts)).toHaveLength(0);
  });

  it('comunicados enviados: destinatários, quantos receberam e quantos leram', async () => {
    const s = await studio();
    await send(s.admin.headers, { audience: 'all', title: 'Primeiro' });
    await send(s.admin.headers, { audience: 'people', title: 'Segundo', userIds: [s.luisa.user.id, s.joao.user.id] });
    const [n] = await notificationsOf(s.joao.user.id);
    await inject('POST', `/notifications/${n.id}/read`, s.joao.headers);
    const list = (await inject('GET', '/broadcasts', s.other.headers)).json();
    expect(list.total).toBe(2);
    expect(list.items[0]).toMatchObject({ title: 'Segundo', audience: 'people', recipientCount: 2, readCount: 0 });
    expect(list.items[0].recipients).toEqual([s.joao.user.name!, s.luisa.user.name!].sort((a, b) => a.localeCompare(b)));
    expect(list.items[1]).toMatchObject({ title: 'Primeiro', audience: 'all', recipients: null, recipientCount: 4, readCount: 1 });
  });

  it('o envio fica no audit_log', async () => {
    const s = await studio();
    const res = await send(s.admin.headers, { audience: 'members' });
    const rows = await db.select().from(schema.auditLog).where(eq(schema.auditLog.entityId, res.json().id));
    expect(rows[0]).toMatchObject({ action: 'broadcast.send', userId: s.admin.user.id });
  });
});

describe('Cada pessoa vê e marca só as próprias (aceite)', () => {
  it('o comunicado aparece só para quem recebeu; ler ou marcar o de outra pessoa responde 404', async () => {
    const s = await studio();
    await send(s.admin.headers, { audience: 'people', userIds: [s.joao.user.id] });
    const [n] = await notificationsOf(s.joao.user.id);
    expect((await inject('GET', '/notifications', s.luisa.headers)).json().items).toEqual([]);
    for (const who of [s.luisa, s.rafael, s.admin]) {
      expect((await inject('POST', `/notifications/${n.id}/read`, who.headers)).statusCode).toBe(404);
    }
    await inject('POST', '/notifications/read-all', s.luisa.headers);
    expect((await notificationsOf(s.joao.user.id))[0].readAt).toBeNull();
  });

  it('marcar uma como lida diminui o contador do sino', async () => {
    const s = await studio();
    await send(s.admin.headers, { audience: 'members', title: 'Um' });
    await send(s.admin.headers, { audience: 'members', title: 'Dois' });
    const bell = async () => (await inject('GET', '/notifications?limit=5', s.joao.headers)).json();
    const before = await bell();
    expect(before.unread).toBe(2);
    await inject('POST', `/notifications/${before.items[0].id}/read`, s.joao.headers);
    expect((await bell()).unread).toBe(1);
    await inject('POST', '/notifications/read-all', s.joao.headers);
    expect((await bell()).unread).toBe(0);
  });
});

describe('Lista da página: aba Todas como padrão, filtros e paginação (aceite)', () => {
  /** 25 notificações para o colaborador, uma por minuto: 15 comunicados, 6 pedidos e 4 avisos do Drive (estes só por teste). */
  async function seed() {
    const s = await studio();
    const base = Date.now() - 60 * 60_000;
    const types: schema.NotificationType[] = [
      ...Array(15).fill('announcement'),
      ...Array(3).fill('deletion.approved'),
      ...Array(3).fill('deletion.rejected'),
      ...Array(4).fill('drive.failed'),
    ];
    await db.insert(schema.notifications).values(
      types.map((type, i) => ({
        userId: s.joao.user.id,
        type,
        title: `n${i}`,
        body: 'b',
        link: null,
        createdAt: new Date(base + i * 60_000),
        readAt: i % 2 ? new Date() : null,
      })),
    );
    return s;
  }
  const get = async (headers: Headers, qs = '') => (await inject('GET', `/notifications${qs}`, headers)).json();

  it('sem parâmetros: todas, lidas e não lidas, da mais recente para a mais antiga, 20 por página', async () => {
    const s = await seed();
    const page1 = await get(s.joao.headers);
    expect(page1).toMatchObject({ total: 25, page: 1, pageSize: 20, unread: 13 });
    expect(page1.items).toHaveLength(20);
    expect(page1.items[0].title).toBe('n24');
    expect(page1.items.some((n: { readAt: string | null }) => n.readAt)).toBe(true);
    const page2 = await get(s.joao.headers, '?page=2');
    expect(page2.items.map((n: { title: string }) => n.title)).toEqual(['n4', 'n3', 'n2', 'n1', 'n0']);
    expect((await get(s.joao.headers, '?page=3')).items).toEqual([]);
  });

  it('aba Não lidas', async () => {
    const s = await seed();
    const r = await get(s.joao.headers, '?view=unread');
    expect(r.total).toBe(13);
    expect(r.items.every((n: { readAt: string | null }) => n.readAt === null)).toBe(true);
  });

  it('filtro por tipo: Pedidos, Comunicados e Drive', async () => {
    const s = await seed();
    expect((await get(s.joao.headers, '?type=requests')).total).toBe(6);
    expect((await get(s.joao.headers, '?type=announcements')).total).toBe(15);
    expect((await get(s.joao.headers, '?type=drive')).total).toBe(4);
    const both = await get(s.joao.headers, '?type=announcements&view=unread');
    expect(both.items.every((n: { type: string; readAt: null }) => n.type === 'announcement' && n.readAt === null)).toBe(true);
    expect(both.total).toBe(8);
  });

  it('o sino pede só as 5 últimas, com o mesmo contador', async () => {
    const s = await seed();
    const r = await get(s.joao.headers, '?limit=5');
    expect(r.items.map((n: { title: string }) => n.title)).toEqual(['n24', 'n23', 'n22', 'n21', 'n20']);
    expect(r.unread).toBe(13);
  });

  it('parâmetros fora do esperado: 400', async () => {
    const s = await seed();
    for (const qs of ['?view=lidas', '?type=email', '?page=0', '?page=x', '?limit=21', '?limit=0']) {
      expect((await inject('GET', `/notifications${qs}`, s.joao.headers)).statusCode).toBe(400);
    }
  });
});

// ---------------------------------------------------------------------------------------------

/** Linhas novas da matriz, cada uma com a rota real, testadas em cada papel. */
const LINES: { row: string; route: string; expected: Record<Role, boolean>; ok: number; call: (h: Headers) => Promise<{ statusCode: number }> }[] = [
  { row: 'Ver as próprias notificações, com filtros', route: 'GET /notifications?view=unread&type=announcements', expected: { admin: true, member: true, viewer: true }, ok: 200, call: (h) => inject('GET', '/notifications?view=unread&type=announcements', h) },
  { row: 'Enviar comunicado', route: 'POST /broadcasts', expected: { admin: true, member: false, viewer: false }, ok: 201, call: (h) => send(h, { audience: 'all' }) },
  { row: 'Ver comunicados enviados', route: 'GET /broadcasts', expected: { admin: true, member: false, viewer: false }, ok: 200, call: (h) => inject('GET', '/broadcasts', h) },
  { row: 'Destinatários do painel de envio', route: 'GET /broadcasts/audience', expected: { admin: true, member: false, viewer: false }, ok: 200, call: (h) => inject('GET', '/broadcasts/audience', h) },
];

describe('Matriz de permissões da página de Notificações, cada linha em cada papel', () => {
  for (const line of LINES) {
    for (const role of ROLES) {
      const allowed = line.expected[role];
      it(`${line.row} (${line.route}) · ${role}: ${allowed ? 'permitido' : '403'}`, async () => {
        await as('member', 'alguem@decroqui.test');
        const me = await as(role);
        expect((await line.call(me.headers)).statusCode).toBe(allowed ? line.ok : 403);
      });
    }
  }
});
