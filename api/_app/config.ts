import { parseEncryptionKey } from './crypto.js';

export interface Config {
  databaseUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  sessionSecret: string;
  adminEmail: string;
  tokenEncryptionKey: Buffer;
  /** Para onde o navegador volta depois do login. */
  appUrl: string;
  secureCookies: boolean;
}

const REQUIRED = [
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'SESSION_SECRET',
  'ADMIN_EMAIL',
  'TOKEN_ENCRYPTION_KEY',
] as const;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
  const sessionSecret = env.SESSION_SECRET!;
  if (sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET precisa ter pelo menos 32 caracteres.');
  }

  const redirect = new URL(env.GOOGLE_REDIRECT_URI!);
  // Em desenvolvimento o callback chega no Fastify (porta 3001) e o front está no Vite (porta 5173).
  // Na Vercel, front e API dividem a mesma origem.
  const appUrl = redirect.port === '3001' ? `${redirect.protocol}//${redirect.hostname}:5173` : redirect.origin;

  return {
    databaseUrl: env.DATABASE_URL!,
    googleClientId: env.GOOGLE_CLIENT_ID!,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET!,
    googleRedirectUri: redirect.toString(),
    sessionSecret,
    adminEmail: env.ADMIN_EMAIL!.trim().toLowerCase(),
    tokenEncryptionKey: parseEncryptionKey(env.TOKEN_ENCRYPTION_KEY!),
    appUrl,
    secureCookies: redirect.protocol === 'https:',
  };
}
