import Fastify, { type FastifyPluginAsync, type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import type { Config } from './config.js';
import { isDbUnavailable, type Db } from './db/client.js';
import type { User } from './db/schema.js';
import { createGoogleClient, GoogleAuthError, type GoogleClient } from './google.js';
import { randomToken, safeEqual } from './crypto.js';
import {
  SESSION_TTL_MS,
  createSession,
  deleteExpiredSessions,
  deleteSession,
  ensureAdmin,
  getSessionUser,
  recordLogin,
  resolveAuthorizedUser,
} from './auth.js';
import { requirePermission, type Permission } from './permissions.js';
import { usersRoutes } from './routes/users.js';
import { projectsRoutes } from './routes/projects.js';
import { filesRoutes } from './routes/files.js';
import { notificationsRoutes } from './routes/notifications.js';
import { stagesRoutes } from './routes/stages.js';
import { createAdminDrive, type DriveClient } from './drive.js';
import type { BudgetPdfRenderer } from './budget-pdf.js';
import { createAdminCalendar, type CalendarClient } from './calendar.js';
import { createCalendarSync } from './calendar-sync.js';
import { eventsRoutes } from './routes/events.js';
import { budgetsRoutes } from './routes/budgets.js';
import { presentationsRoutes } from './routes/presentations.js';

export const SESSION_COOKIE = 'decroqui_sid';
const FLOW_COOKIE = 'decroqui_oauth';
const FLOW_TTL_S = 10 * 60;

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null;
  }
  interface FastifyContextConfig {
    permission?: Permission;
  }
}

export interface AppDeps {
  config: Config;
  db: Db;
  google?: GoogleClient;
  /** Drive usado nas escritas (token do administrador). Substituível nos testes. */
  drive?: DriveClient;
  /** Gerador do PDF do orçamento. Nos testes, um falso que não abre navegador. */
  pdf?: BudgetPdfRenderer;
  /** Google Agenda (token do administrador). Substituível nos testes. */
  calendar?: CalendarClient;
  logger?: boolean;
  /** Rotas extras no escopo protegido, com as mesmas regras de sessão e permissão. Usado nos testes. */
  extraProtectedRoutes?: FastifyPluginAsync;
}

export async function buildApp({ config, db, google, drive, pdf, calendar, logger = false, extraProtectedRoutes }: AppDeps) {
  const app = Fastify({ logger, trustProxy: true });
  const googleClient =
    google ??
    createGoogleClient({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      redirectUri: config.googleRedirectUri,
    });

  await app.register(cookie, { secret: config.sessionSecret });
  app.decorateRequest('user', null);

  // Banco sem resposta ou conexão caída: 503 na hora, em vez de deixar a requisição esperar o limite da Vercel.
  app.setErrorHandler((err, request, reply) => {
    if (!isDbUnavailable(err)) throw err;
    request.log.warn({ err: (err as Error).message }, 'banco indisponível');
    return reply.code(503).header('retry-after', '5').send({ error: 'db_unavailable' });
  });

  await ensureAdmin(db, config.adminEmail);

  const baseCookie = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: config.secureCookies, signed: true };
  const loginUrl = (erro?: string) => `${config.appUrl}/entrar${erro ? `?erro=${erro}` : ''}`;

  function readSigned(request: FastifyRequest, name: string): string | null {
    const raw = request.cookies[name];
    if (!raw) return null;
    const result = request.unsignCookie(raw);
    return result.valid ? result.value : null;
  }

  async function requireSession(request: FastifyRequest, reply: FastifyReply) {
    const token = readSigned(request, SESSION_COOKIE);
    const user = token ? await getSessionUser(db, token) : null;
    if (!user) {
      if (token) reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return reply.code(401).send({ error: 'unauthorized' });
    }
    request.user = user;
  }

  app.get('/health', async () => ({ ok: true }));

  // `?reconectar=1`: pede o consentimento de novo, para o Google devolver um refresh token novo
  // (o anterior venceu; no modo de teste ele dura cerca de 7 dias).
  app.get<{ Querystring: { reconectar?: string } }>('/auth/google', async (request, reply) => {
    const state = randomToken();
    const verifier = randomToken(48);
    reply.setCookie(FLOW_COOKIE, JSON.stringify({ state, verifier }), { ...baseCookie, maxAge: FLOW_TTL_S });
    return reply.redirect(googleClient.authorizationUrl(state, verifier, { consent: request.query.reconectar === '1' }));
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/auth/google/callback',
    async (request, reply) => {
      const flowRaw = readSigned(request, FLOW_COOKIE);
      reply.clearCookie(FLOW_COOKIE, { path: '/' });

      const { code, state, error } = request.query;
      if (error) return reply.redirect(loginUrl('cancelado'));

      let flow: { state?: string; verifier?: string } = {};
      try {
        flow = flowRaw ? JSON.parse(flowRaw) : {};
      } catch {
        // cookie corrompido: tratado abaixo como fluxo inválido
      }
      if (!code || !state || !flow.state || !flow.verifier || !safeEqual(state, flow.state)) {
        return reply.redirect(loginUrl('falha'));
      }

      try {
        const tokens = await googleClient.exchangeCode(code, flow.verifier);
        const identity = await googleClient.verifyIdToken(tokens.idToken);
        const user = await resolveAuthorizedUser(db, identity);
        if (!user) {
          request.log.warn({ email: identity.email }, 'login recusado: conta não autorizada');
          return reply.redirect(loginUrl('sem-acesso'));
        }
        await recordLogin(db, user, identity, tokens.refreshToken, config.tokenEncryptionKey);
        await deleteExpiredSessions(db);
        const session = await createSession(db, user.id);
        reply.setCookie(SESSION_COOKIE, session.token, { ...baseCookie, maxAge: SESSION_TTL_MS / 1000 });
        return reply.redirect(`${config.appUrl}/`);
      } catch (err) {
        request.log.error({ err: err instanceof GoogleAuthError ? err.message : err }, 'falha no login com Google');
        return reply.redirect(loginUrl('falha'));
      }
    },
  );

  app.post('/auth/logout', async (request, reply) => {
    const token = readSigned(request, SESSION_COOKIE);
    if (token) await deleteSession(db, token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.code(204).send();
  });

  // Rotas protegidas: tudo registrado aqui exige sessão válida. Rotas de escrita precisam
  // declarar `config.permission` (seção 5); sem isso o servidor nem sobe.
  await app.register(async (protectedRoutes) => {
    protectedRoutes.addHook('onRoute', (route) => {
      const methods = [route.method].flat();
      const writes = methods.some((m) => !['GET', 'HEAD', 'OPTIONS'].includes(m));
      if (writes && !route.config?.permission) {
        throw new Error(`Rota de escrita sem permissão declarada: ${methods.join(',')} ${route.url}`);
      }
    });
    protectedRoutes.addHook('preHandler', requireSession);
    protectedRoutes.addHook('preHandler', async (request, reply) => {
      const permission = request.routeOptions.config.permission;
      if (permission) return requirePermission(permission)(request, reply);
    });

    protectedRoutes.get('/me', async (request) => {
      const u = request.user!;
      return { id: u.id, email: u.email, name: u.name, role: u.role };
    });

    const driveClient = drive ?? createAdminDrive({ config, db });
    await protectedRoutes.register(usersRoutes, { db, drive: driveClient, adminEmail: config.adminEmail });
    await protectedRoutes.register(projectsRoutes, { db, drive: driveClient });
    await protectedRoutes.register(filesRoutes, {
      db,
      drive: driveClient,
      sessionSecret: config.sessionSecret,
      appOrigin: new URL(config.appUrl).origin,
    });
    await protectedRoutes.register(notificationsRoutes, { db });
    await protectedRoutes.register(stagesRoutes, { db });
    const sync = createCalendarSync({ db, calendar: calendar ?? createAdminCalendar({ config, db }) });
    await protectedRoutes.register(eventsRoutes, { db, sync });
    await protectedRoutes.register(budgetsRoutes, { db, drive: driveClient, pdf: pdf ?? lazyPdfRenderer(config.pdfBrowserPath) });
    await protectedRoutes.register(presentationsRoutes, { db });
    if (extraProtectedRoutes) await protectedRoutes.register(extraProtectedRoutes);
  });

  return app;
}

/**
 * Gerador de PDF carregado só no primeiro pedido de PDF. O módulo traz o React do servidor e as folhas
 * (src/budget/BudgetSheets.tsx); se algo nele falhar, só o "Salvar em PDF" responde erro, e login,
 * projetos e orçamentos seguem funcionando. Uma falha ao carregar não fica guardada: o próximo pedido tenta de novo.
 */
export function lazyPdfRenderer(executablePath?: string, load = () => import('./budget-pdf.js')): BudgetPdfRenderer {
  let renderer: Promise<BudgetPdfRenderer> | null = null;
  return {
    async render(data) {
      renderer ??= load().then(
        (m) => m.createPdfRenderer(executablePath),
        (err) => {
          renderer = null;
          throw err;
        },
      );
      return (await renderer).render(data);
    },
  };
}
