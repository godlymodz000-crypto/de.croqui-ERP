// Testes da Fase 4 (ESPECIFICACAO.md, seções 4, 5, 9 e 12): Kanban, etapas e histórico de etapas.
// Banco em memória (PGlite). Os projetos entram direto no banco: o Drive não participa desta fase.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { asc, eq, isNull } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../api/_app/app.js';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { createSession } from '../api/_app/auth.js';
import { randomToken } from '../api/_app/crypto.js';
import { compareCards, MAX_STAGE_NAME } from '../api/_app/routes/stages.js';
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
type Headers = { cookie: string };
let admin: Headers;
let adminId: string;
let member: Headers;
let memberId: string;
let viewer: Headers;

async function login(userId: string): Promise<Headers> {
  const { token } = await createSession(db, userId);
  return { cookie: `${SESSION_COOKIE}=${app.signCookie(token)}` };
}

async function person(role: 'member' | 'viewer') {
  const [u] = await db
    .insert(schema.users)
    .values({ email: `${role}@decroqui.test`, name: role === 'member' ? 'Joana Vieira' : 'Leo Mota', role, status: 'active' })
    .returning();
  return { id: u.id, headers: await login(u.id) };
}

async function stageList() {
  return db.select().from(schema.stages).where(isNull(schema.stages.deletedAt)).orderBy(asc(schema.stages.position));
}

async function stageId(name: string) {
  const s = (await stageList()).find((x) => x.name === name);
  if (!s) throw new Error(`etapa ${name} não existe`);
  return s.id;
}

async function project(name: string, stage: string, deadline: string | null = null) {
  const [p] = await db
    .insert(schema.projects)
    .values({ name, clientName: `Cliente ${name}`, stageId: await stageId(stage), ownerUserId: memberId, driveFolderId: `pasta-${name}`, deadline })
    .returning();
  return p;
}

async function projectStage(id: string) {
  const [p] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
  return p.stageId;
}

async function history(projectId: string) {
  return db
    .select()
    .from(schema.projectStageHistory)
    .where(eq(schema.projectStageHistory.projectId, projectId))
    .orderBy(asc(schema.projectStageHistory.at));
}

async function auditRows(action: string) {
  return db.select().from(schema.auditLog).where(eq(schema.auditLog.action, action));
}

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  app = await buildApp({ config, db, drive: new FakeDrive() });
  const [a] = await db.select().from(schema.users).where(eq(schema.users.email, ADMIN_EMAIL));
  adminId = a.id;
  admin = await login(a.id);
  ({ id: memberId, headers: member } = await person('member'));
  ({ headers: viewer } = await person('viewer'));
});

afterEach(async () => {
  await app.close();
});

describe('Kanban', () => {
  it('uma leitura traz as etapas na ordem e os cartões, com prazo mais próximo primeiro', async () => {
    await project('Sem prazo', 'Briefing');
    await project('Casa Loureiro', 'Briefing', '2026-11-10');
    await project('Apartamento Jardins', 'Briefing', '2026-11-03');
    await project('Casa Alecrim', 'Projeto', '2026-11-03');
    const res = await app.inject({ method: 'GET', url: '/board', headers: viewer });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stages.map((s: { name: string }) => s.name)).toEqual([
      'Briefing', 'Levantamento', 'Projeto', 'Orçamento', 'Aprovação', 'Execução', 'Entrega',
    ]);
    expect(body.projects.map((p: { name: string }) => p.name)).toEqual(['Apartamento Jardins', 'Casa Alecrim', 'Casa Loureiro', 'Sem prazo']);
    expect(body.projects[0]).toMatchObject({ clientName: 'Cliente Apartamento Jardins', owner: 'Joana Vieira', deadline: '2026-11-03' });
  });

  it('projeto excluído e etapa removida não aparecem', async () => {
    const p = await project('Excluído', 'Briefing');
    await db.update(schema.projects).set({ deletedAt: new Date() }).where(eq(schema.projects.id, p.id));
    await db.update(schema.stages).set({ deletedAt: new Date() }).where(eq(schema.stages.name, 'Entrega'));
    const body = (await app.inject({ method: 'GET', url: '/board', headers: member })).json();
    expect(body.projects).toEqual([]);
    expect(body.stages.map((s: { name: string }) => s.name)).not.toContain('Entrega');
  });

  it('sem sessão, o Kanban responde 401', async () => {
    expect((await app.inject({ method: 'GET', url: '/board' })).statusCode).toBe(401);
  });

  it('ordem: prazos iguais saem por nome, sem prazo vai para o fim', () => {
    const cards = [
      { name: 'Beta', deadline: null },
      { name: 'Ária', deadline: '2026-11-05' },
      { name: 'Casa', deadline: '2026-11-01' },
      { name: 'Alfa', deadline: '2026-11-05' },
    ];
    expect(cards.sort(compareCards).map((c) => c.name)).toEqual(['Casa', 'Alfa', 'Ária', 'Beta']);
  });
});

describe('mover cartão', () => {
  it('muda a etapa no banco, grava o histórico e o audit_log', async () => {
    const p = await project('Casa Figueira', 'Projeto');
    const from = await stageId('Projeto');
    const to = await stageId('Orçamento');
    const res = await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: member, payload: { stageId: to } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: p.id, stageId: to });
    expect(await projectStage(p.id)).toBe(to);

    const h = await history(p.id);
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ fromStageId: from, toStageId: to, userId: memberId });
    expect(h[0].at).toBeInstanceOf(Date);

    const logs = await auditRows('project.move');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ entity: 'project', entityId: p.id, userId: memberId });
    expect(logs[0].payload).toEqual({ fromStageId: from, toStageId: to, reason: 'move' });
  });

  it('cada movimento ganha a sua linha no histórico, na ordem', async () => {
    const p = await project('Loft', 'Briefing');
    const [b, l, pr] = [await stageId('Briefing'), await stageId('Levantamento'), await stageId('Projeto')];
    await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: admin, payload: { stageId: l } });
    await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: admin, payload: { stageId: pr } });
    const h = await history(p.id);
    expect(h.map((x) => [x.fromStageId, x.toStageId])).toEqual([[b, l], [l, pr]]);
    expect(h.every((x) => x.userId === adminId)).toBe(true);
  });

  it('soltar na mesma etapa não grava nada', async () => {
    const p = await project('Parado', 'Briefing');
    const res = await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: member, payload: { stageId: p.stageId } });
    expect(res.statusCode).toBe(200);
    expect(await history(p.id)).toHaveLength(0);
    expect(await auditRows('project.move')).toHaveLength(0);
  });

  it('etapa removida, inexistente ou inválida é recusada e nada muda', async () => {
    const p = await project('Casa', 'Briefing');
    const entrega = await stageId('Entrega');
    await db.update(schema.stages).set({ deletedAt: new Date() }).where(eq(schema.stages.id, entrega));
    for (const stageIdValue of [entrega, '00000000-0000-4000-8000-000000000000']) {
      const res = await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: member, payload: { stageId: stageIdValue } });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('invalid_stage');
    }
    const bad = await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: member, payload: { stageId: 'x' } });
    expect(bad.statusCode).toBe(400);
    expect(await projectStage(p.id)).toBe(p.stageId);
    expect(await history(p.id)).toHaveLength(0);
  });

  it('projeto excluído ou inexistente responde 404', async () => {
    const p = await project('Apagado', 'Briefing');
    await db.update(schema.projects).set({ deletedAt: new Date() }).where(eq(schema.projects.id, p.id));
    const to = await stageId('Projeto');
    for (const id of [p.id, '00000000-0000-4000-8000-000000000000', 'nao-e-uuid']) {
      const res = await app.inject({ method: 'PATCH', url: `/projects/${id}/stage`, headers: admin, payload: { stageId: to } });
      expect(res.statusCode).toBe(404);
    }
  });

  it('leitor não move: 403 e nada muda', async () => {
    const p = await project('Casa', 'Briefing');
    const res = await app.inject({ method: 'PATCH', url: `/projects/${p.id}/stage`, headers: viewer, payload: { stageId: await stageId('Projeto') } });
    expect(res.statusCode).toBe(403);
    expect(await projectStage(p.id)).toBe(p.stageId);
    expect(await history(p.id)).toHaveLength(0);
    expect(await auditRows('project.move')).toHaveLength(0);
  });
});

describe('etapas', () => {
  it('criar põe a etapa no fim e registra no audit_log', async () => {
    const res = await app.inject({ method: 'POST', url: '/stages', headers: admin, payload: { name: '  Pós-obra  ' } });
    expect(res.statusCode).toBe(201);
    const created = res.json();
    expect(created).toMatchObject({ name: 'Pós-obra', position: 8 });
    expect((await stageList()).at(-1)?.name).toBe('Pós-obra');
    const [log] = await auditRows('stage.create');
    expect(log).toMatchObject({ entity: 'stage', entityId: created.id, userId: adminId });
  });

  it('nome vazio, longo demais ou repetido é recusado', async () => {
    const cases: [unknown, string][] = [
      ['', 'required'],
      ['   ', 'required'],
      [undefined, 'required'],
      ['x'.repeat(MAX_STAGE_NAME + 1), 'too_long'],
      ['briefing', 'taken'],
    ];
    for (const [name, field] of cases) {
      const res = await app.inject({ method: 'POST', url: '/stages', headers: admin, payload: { name } });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: 'validation', fields: { name: field } });
    }
    expect(await stageList()).toHaveLength(7);
  });

  it('o nome de uma etapa removida pode ser usado de novo', async () => {
    await db.update(schema.stages).set({ deletedAt: new Date() }).where(eq(schema.stages.name, 'Entrega'));
    const res = await app.inject({ method: 'POST', url: '/stages', headers: admin, payload: { name: 'Entrega' } });
    expect(res.statusCode).toBe(201);
  });

  it('renomear muda o nome, mantém o ID e os projetos, e registra de onde para onde', async () => {
    const id = await stageId('Execução');
    const p = await project('Obra', 'Execução');
    const res = await app.inject({ method: 'PATCH', url: `/stages/${id}`, headers: admin, payload: { name: 'Obra' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id, name: 'Obra', position: 6 });
    expect(await stageId('Obra')).toBe(id);
    expect(await projectStage(p.id)).toBe(id);
    const [log] = await auditRows('stage.rename');
    expect(log.payload).toEqual({ from: 'Execução', to: 'Obra' });
  });

  it('renomear para o nome de outra etapa é recusado; mudar só maiúsculas da própria vale', async () => {
    const id = await stageId('Execução');
    const taken = await app.inject({ method: 'PATCH', url: `/stages/${id}`, headers: admin, payload: { name: 'ENTREGA' } });
    expect(taken.statusCode).toBe(400);
    expect(taken.json().fields).toEqual({ name: 'taken' });
    const same = await app.inject({ method: 'PATCH', url: `/stages/${id}`, headers: admin, payload: { name: 'EXECUÇÃO' } });
    expect(same.statusCode).toBe(200);
  });

  it('renomear etapa removida ou inexistente responde 404', async () => {
    const id = await stageId('Entrega');
    await db.update(schema.stages).set({ deletedAt: new Date() }).where(eq(schema.stages.id, id));
    for (const target of [id, '00000000-0000-4000-8000-000000000000', 'nao-e-uuid']) {
      const res = await app.inject({ method: 'PATCH', url: `/stages/${target}`, headers: admin, payload: { name: 'Nova' } });
      expect(res.statusCode).toBe(404);
    }
  });

  it('remover etapa vazia não pede destino e é lógica', async () => {
    const id = await stageId('Entrega');
    const res = await app.inject({ method: 'DELETE', url: `/stages/${id}`, headers: admin });
    expect(res.statusCode).toBe(204);
    const [row] = await db.select().from(schema.stages).where(eq(schema.stages.id, id));
    expect(row.deletedAt).toBeInstanceOf(Date);
    const [log] = await auditRows('stage.delete');
    expect(log.payload).toEqual({ name: 'Entrega', destinationStageId: null, movedProjectIds: [] });
  });

  it('remover com destino leva os projetos, com uma linha de histórico e de audit_log por projeto', async () => {
    const lev = await stageId('Levantamento');
    const brief = await stageId('Briefing');
    const a = await project('Cobertura Oliva', 'Levantamento');
    const b = await project('Consultório Paula Sá', 'Levantamento');
    const other = await project('Fica', 'Projeto');
    const res = await app.inject({ method: 'DELETE', url: `/stages/${lev}`, headers: admin, payload: { destinationStageId: brief } });
    expect(res.statusCode).toBe(204);

    expect(await projectStage(a.id)).toBe(brief);
    expect(await projectStage(b.id)).toBe(brief);
    expect(await projectStage(other.id)).toBe(other.stageId);
    for (const p of [a, b]) {
      const h = await history(p.id);
      expect(h).toHaveLength(1);
      expect(h[0]).toMatchObject({ fromStageId: lev, toStageId: brief, userId: adminId });
    }
    const moves = await auditRows('project.move');
    expect(moves.map((m) => m.entityId).sort()).toEqual([a.id, b.id].sort());
    expect(moves.every((m) => (m.payload as { reason: string }).reason === 'stage_removed')).toBe(true);
    const [log] = await auditRows('stage.delete');
    expect(log.payload).toMatchObject({ name: 'Levantamento', destinationStageId: brief });
    expect(((log.payload as { movedProjectIds: string[] }).movedProjectIds).sort()).toEqual([a.id, b.id].sort());
    expect((await stageList()).map((s) => s.id)).not.toContain(lev);
  });

  it('remover etapa com projetos sem destino falha e nada muda', async () => {
    const lev = await stageId('Levantamento');
    const p = await project('Cobertura Oliva', 'Levantamento');
    for (const payload of [undefined, {}, { destinationStageId: '' }]) {
      const res = await app.inject({ method: 'DELETE', url: `/stages/${lev}`, headers: admin, payload });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: 'destination_required', projects: 1 });
    }
    expect(await projectStage(p.id)).toBe(lev);
    expect((await stageList()).map((s) => s.id)).toContain(lev);
    expect(await history(p.id)).toHaveLength(0);
    expect(await auditRows('stage.delete')).toHaveLength(0);
  });

  it('o destino não pode ser a própria etapa, uma etapa removida nem uma que não existe', async () => {
    const lev = await stageId('Levantamento');
    const entrega = await stageId('Entrega');
    await db.update(schema.stages).set({ deletedAt: new Date() }).where(eq(schema.stages.id, entrega));
    const p = await project('Cobertura Oliva', 'Levantamento');
    for (const dest of [lev, entrega, '00000000-0000-4000-8000-000000000000', 'nao-e-uuid']) {
      const res = await app.inject({ method: 'DELETE', url: `/stages/${lev}`, headers: admin, payload: { destinationStageId: dest } });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('invalid_destination');
    }
    expect(await projectStage(p.id)).toBe(lev);
  });

  it('projeto excluído na etapa não exige destino nem é movido', async () => {
    const lev = await stageId('Levantamento');
    const p = await project('Antigo', 'Levantamento');
    await db.update(schema.projects).set({ deletedAt: new Date() }).where(eq(schema.projects.id, p.id));
    const res = await app.inject({ method: 'DELETE', url: `/stages/${lev}`, headers: admin });
    expect(res.statusCode).toBe(204);
    expect(await projectStage(p.id)).toBe(lev);
  });

  it('a última etapa não pode ser removida: os projetos ficariam sem destino', async () => {
    const all = await stageList();
    const last = all.at(-1)!;
    for (const s of all.slice(0, -1)) await db.update(schema.stages).set({ deletedAt: new Date() }).where(eq(schema.stages.id, s.id));
    const res = await app.inject({ method: 'DELETE', url: `/stages/${last.id}`, headers: admin });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('last_stage');
    expect(await stageList()).toHaveLength(1);
  });

  it('remover etapa já removida ou inexistente responde 404', async () => {
    const id = await stageId('Entrega');
    expect((await app.inject({ method: 'DELETE', url: `/stages/${id}`, headers: admin })).statusCode).toBe(204);
    for (const target of [id, '00000000-0000-4000-8000-000000000000', 'nao-e-uuid']) {
      expect((await app.inject({ method: 'DELETE', url: `/stages/${target}`, headers: admin })).statusCode).toBe(404);
    }
  });

  it('colaborador e leitor não criam, não renomeiam e não removem etapas', async () => {
    const id = await stageId('Entrega');
    const p = await project('Casa', 'Entrega');
    for (const headers of [member, viewer]) {
      const calls = [
        app.inject({ method: 'POST', url: '/stages', headers, payload: { name: 'Nova' } }),
        app.inject({ method: 'PATCH', url: `/stages/${id}`, headers, payload: { name: 'Outra' } }),
        app.inject({ method: 'DELETE', url: `/stages/${id}`, headers, payload: { destinationStageId: await stageId('Briefing') } }),
      ];
      for (const res of await Promise.all(calls)) {
        expect(res.statusCode).toBe(403);
        expect(res.json()).toEqual({ error: 'forbidden' });
      }
    }
    expect(await stageList()).toHaveLength(7);
    expect(await stageId('Entrega')).toBe(id);
    expect(await projectStage(p.id)).toBe(id);
    const writes = await db.select().from(schema.auditLog).where(eq(schema.auditLog.entity, 'stage'));
    expect(writes).toHaveLength(0);
  });
});
