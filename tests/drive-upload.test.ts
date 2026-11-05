// Envio do PDF do orçamento ao Drive (createAdminDrive().uploadFile) com o fetch injetado: nada sai para o Google.
// Sessão retomável: POST uploadType=resumable abre a sessão, PUT no endereço devolvido envia o conteúdo.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Config } from '../api/_app/config.js';
import type { Db } from '../api/_app/db/client.js';
import * as schema from '../api/_app/db/schema.js';
import { encrypt, randomToken } from '../api/_app/crypto.js';
import { createAdminDrive, DriveError } from '../api/_app/drive.js';

const ADMIN_EMAIL = 'admin@decroqui.test';
const config: Config = {
  databaseUrl: 'pglite://memory',
  googleClientId: 'test-client.apps.googleusercontent.com',
  googleClientSecret: 'segredo-de-teste',
  googleRedirectUri: 'http://localhost:3001/auth/google/callback',
  sessionSecret: randomToken(32),
  adminEmail: ADMIN_EMAIL,
  tokenEncryptionKey: Buffer.alloc(32, 7),
  appUrl: 'http://localhost:5173',
  secureCookies: false,
};

const SESSION_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=sessao-teste';

type Call = { url: string; method: string; headers: Headers; body: Uint8Array | null };

/** Google simulado: token, abertura da sessão e PUT do conteúdo, com respostas configuráveis por etapa. */
function fakeGoogle(opts: { session?: number; put?: number; noLocation?: boolean } = {}) {
  const calls: Call[] = [];
  const doFetch: typeof fetch = async (input, init = {}) => {
    const url = String(input);
    const raw = init.body;
    const body =
      raw == null ? null : typeof raw === 'string' ? new TextEncoder().encode(raw) : raw instanceof Uint8Array ? raw : new Uint8Array(await new Response(raw as BodyInit).arrayBuffer());
    calls.push({ url, method: init.method ?? 'GET', headers: new Headers(init.headers), body });
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'token-de-teste', expires_in: 3600 }), { status: 200 });
    }
    if (url.includes('uploadType=resumable') && init.method === 'POST') {
      const status = opts.session ?? 200;
      return new Response(status === 200 ? '' : '{"error":{}}', {
        status,
        headers: status === 200 && !opts.noLocation ? { location: SESSION_URL } : {},
      });
    }
    if (url === SESSION_URL && init.method === 'PUT') {
      const status = opts.put ?? 200;
      if (status !== 200) return new Response('{"error":{}}', { status });
      const meta = JSON.parse(new TextDecoder().decode(calls.find((c) => c.method === 'POST' && c.url.includes('resumable'))!.body!));
      return new Response(
        JSON.stringify({ id: 'arquivo-1', name: meta.name, mimeType: meta.mimeType, size: String(body!.byteLength), parents: meta.parents, trashed: false }),
        { status: 200 },
      );
    }
    return new Response('inesperado', { status: 599 });
  };
  return { calls, doFetch };
}

/** PDF de mentira com todos os 256 valores de byte, incluindo CR, LF e zeros, para pegar qualquer conversão de texto. */
function samplePdf(): Uint8Array {
  const head = new TextEncoder().encode('%PDF-1.7\r\n');
  const all = Uint8Array.from({ length: 256 * 4 }, (_, i) => i % 256);
  const out = new Uint8Array(head.length + all.length);
  out.set(head);
  out.set(all, head.length);
  return out;
}

let db: Db;

beforeEach(async () => {
  const pg = new PGlite();
  const pgDb = drizzle(pg, { schema });
  await migrate(pgDb, { migrationsFolder: './drizzle' });
  db = pgDb as unknown as Db;
  await db.insert(schema.users).values({
    email: ADMIN_EMAIL,
    role: 'admin',
    status: 'active',
    googleRefreshToken: encrypt('refresh-de-teste', config.tokenEncryptionKey),
  });
});

const input = (body: Uint8Array) => ({ name: 'Orcamento-1-Sala-2026-11-04.pdf', mimeType: 'application/pdf', parentId: 'pasta-orcamentos', body });

describe('uploadFile (PDF do orçamento)', () => {
  it('abre a sessão retomável com os metadados e envia o conteúdo num PUT', async () => {
    const google = fakeGoogle();
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    const pdf = samplePdf();
    const file = await drive.uploadFile(input(pdf));

    expect(file).toEqual({ id: 'arquivo-1', name: 'Orcamento-1-Sala-2026-11-04.pdf', mimeType: 'application/pdf', size: pdf.byteLength, parents: ['pasta-orcamentos'], trashed: false });

    const [open, put] = google.calls.filter((c) => c.url.includes('googleapis.com/upload'));
    expect(open.method).toBe('POST');
    expect(open.url).toBe('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,parents,trashed');
    expect(open.headers.get('authorization')).toBe('Bearer token-de-teste');
    expect(open.headers.get('content-type')).toBe('application/json; charset=UTF-8');
    expect(open.headers.get('x-upload-content-type')).toBe('application/pdf');
    expect(open.headers.get('x-upload-content-length')).toBe(String(pdf.byteLength));
    expect(JSON.parse(new TextDecoder().decode(open.body!))).toEqual({ name: 'Orcamento-1-Sala-2026-11-04.pdf', mimeType: 'application/pdf', parents: ['pasta-orcamentos'] });

    expect(put.method).toBe('PUT');
    expect(put.url).toBe(SESSION_URL);
    expect(put.headers.get('content-type')).toBe('application/pdf');
    expect(google.calls.some((c) => c.url.includes('uploadType=multipart'))).toBe(false);
  });

  it('os bytes do PDF chegam intactos no PUT', async () => {
    const google = fakeGoogle();
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    const pdf = samplePdf();
    await drive.uploadFile(input(pdf));
    const put = google.calls.find((c) => c.method === 'PUT')!;
    expect(put.body!.byteLength).toBe(pdf.byteLength);
    expect(Buffer.from(put.body!).equals(Buffer.from(pdf))).toBe(true);
  });

  it.each([400, 403, 404])('abertura da sessão recusada com %i: DriveError, sem PUT', async (status) => {
    const google = fakeGoogle({ session: status });
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(new DriveError(`Abertura da sessão de upload falhou (${status}).`));
    expect(google.calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('abertura sem endereço da sessão: DriveError, sem PUT', async () => {
    const google = fakeGoogle({ noLocation: true });
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(DriveError);
    expect(google.calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it.each([500, 503])('abertura da sessão com %i: DriveError', async (status) => {
    const google = fakeGoogle({ session: status });
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(`Abertura da sessão de upload falhou (${status}).`);
  });

  it.each([400, 403])('PUT do conteúdo recusado com %i: DriveError', async (status) => {
    const google = fakeGoogle({ put: status });
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(new DriveError(`Envio do arquivo falhou (${status}).`));
  });

  it.each([500, 502, 503])('PUT do conteúdo com %i: DriveError', async (status) => {
    const google = fakeGoogle({ put: status });
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(`Envio do arquivo falhou (${status}).`);
  });

  it('PUT com 401: o token guardado é descartado e o próximo envio pede outro', async () => {
    const google = fakeGoogle({ put: 401 });
    const drive = createAdminDrive({ config, db, fetch: google.doFetch });
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(DriveError);
    await expect(drive.uploadFile(input(samplePdf()))).rejects.toThrow(DriveError);
    expect(google.calls.filter((c) => c.url.startsWith('https://oauth2.googleapis.com/token'))).toHaveLength(2);
  });
});
