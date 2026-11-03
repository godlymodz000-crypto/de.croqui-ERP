import { eq } from 'drizzle-orm';
import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { users } from './db/schema.js';
import { decrypt } from './crypto.js';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/** O token do administrador não serviu. `reconnect`: o Google recusou o refresh token (vencido ou revogado). */
export class AdminTokenError extends Error {
  constructor(
    message: string,
    public reconnect = false,
  ) {
    super(message);
  }
}

/**
 * Token de acesso do administrador (ADMIN_EMAIL), renovado pelo refresh token guardado criptografado.
 * Drive e Agenda usam o mesmo token: o login pede os dois escopos juntos.
 */
export function createAdminAccessToken({ config, db, fetch: doFetch = fetch }: { config: Config; db: Db; fetch?: typeof fetch }) {
  let cached: { token: string; expiresAt: number } | null = null;

  async function accessToken(): Promise<string> {
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
    const [admin] = await db
      .select({ refreshToken: users.googleRefreshToken })
      .from(users)
      .where(eq(users.email, config.adminEmail))
      .limit(1);
    if (!admin?.refreshToken) throw new AdminTokenError('O administrador ainda não autorizou o Google (sem refresh token).', true);
    const res = await doFetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        refresh_token: decrypt(admin.refreshToken, config.tokenEncryptionKey),
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) {
      // invalid_grant: o refresh token venceu (7 dias no modo de teste) ou foi revogado. Só entrando de novo.
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new AdminTokenError(`Renovação do token do administrador falhou (${res.status}).`, body.error === 'invalid_grant');
    }
    const body = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new AdminTokenError('Resposta do Google sem access_token.');
    cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return cached.token;
  }

  return {
    accessToken,
    /** O Google respondeu 401: o token guardado não vale mais. */
    forget() {
      cached = null;
    },
  };
}
