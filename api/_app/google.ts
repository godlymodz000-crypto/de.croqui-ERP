import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { pkceChallenge } from './crypto.js';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
];

export interface GoogleClientOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** Substituíveis nos testes. */
  jwks?: JWTVerifyGetKey;
  fetch?: typeof fetch;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string | null;
}

export interface GoogleTokens {
  idToken: string;
  refreshToken: string | null;
}

export class GoogleAuthError extends Error {}

export function createGoogleClient(opts: GoogleClientOptions) {
  const jwks = opts.jwks ?? createRemoteJWKSet(new URL(JWKS_URL));
  const doFetch = opts.fetch ?? fetch;

  return {
    authorizationUrl(state: string, codeVerifier: string): string {
      const url = new URL(AUTH_ENDPOINT);
      url.search = new URLSearchParams({
        client_id: opts.clientId,
        redirect_uri: opts.redirectUri,
        response_type: 'code',
        scope: SCOPES.join(' '),
        state,
        code_challenge: pkceChallenge(codeVerifier),
        code_challenge_method: 'S256',
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'select_account',
      }).toString();
      return url.toString();
    },

    async exchangeCode(code: string, codeVerifier: string): Promise<GoogleTokens> {
      const res = await doFetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          code_verifier: codeVerifier,
          client_id: opts.clientId,
          client_secret: opts.clientSecret,
          redirect_uri: opts.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      if (!res.ok) throw new GoogleAuthError(`Troca do código falhou (${res.status}).`);
      const body = (await res.json()) as { id_token?: string; refresh_token?: string };
      if (!body.id_token) throw new GoogleAuthError('Resposta do Google sem id_token.');
      return { idToken: body.id_token, refreshToken: body.refresh_token ?? null };
    },

    /** Confere assinatura, aud, iss, expiração e email_verified. */
    async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
      let payload;
      try {
        ({ payload } = await jwtVerify(idToken, jwks, {
          issuer: ISSUERS,
          audience: opts.clientId,
          algorithms: ['RS256'],
        }));
      } catch (err) {
        throw new GoogleAuthError(`ID token inválido: ${(err as Error).message}`);
      }
      if (payload.email_verified !== true) throw new GoogleAuthError('E-mail da conta Google não verificado.');
      if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
        throw new GoogleAuthError('ID token sem sub ou e-mail.');
      }
      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: typeof payload.name === 'string' ? payload.name : null,
      };
    },
  };
}

export type GoogleClient = ReturnType<typeof createGoogleClient>;
