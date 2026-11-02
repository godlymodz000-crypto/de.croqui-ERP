import { createHmac } from 'node:crypto';
import { safeEqual } from './crypto.js';
import type { Subfolder } from './db/schema.js';

/**
 * O que o servidor autorizou ao abrir uma sessão de upload. Vai assinado para o navegador e volta
 * na confirmação, para o servidor só registrar o arquivo que ele mesmo autorizou. Nada vai para o
 * banco antes da confirmação, então um envio que falha não deixa registro.
 */
export interface UploadGrant {
  projectId: string;
  folderId: string;
  subfolder: Subfolder;
  source: 'upload' | 'pdf_export';
  name: string;
  mimeType: string;
  size: number;
  userId: string;
  expiresAt: number;
}

// Sessões retomáveis do Drive valem uma semana; aqui basta um dia.
export const UPLOAD_GRANT_TTL_MS = 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`upload:${payload}`).digest('base64url');
}

export function signGrant(grant: UploadGrant, secret: string): string {
  const payload = Buffer.from(JSON.stringify(grant)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyGrant(token: unknown, secret: string, now = Date.now()): UploadGrant | null {
  if (typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) return null;
  try {
    const grant = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as UploadGrant;
    return grant.expiresAt > now ? grant : null;
  } catch {
    return null;
  }
}
