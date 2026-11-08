import { createHmac } from 'node:crypto';
import { and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { presentationImages, presentationImageUses } from './db/schema.js';
import { safeEqual } from './crypto.js';
import { ensureRootFolder, projectSubfolderId, type DriveClient } from './drive.js';
import { LOOSE_BUDGETS_FOLDER } from './budget-files.js';

// Imagens das apresentações (Fase 6b, etapa E4): autorização do envio direto ao Drive, pastas, vínculos
// entre apresentação e imagem e a regra da lixeira (P22).

/** Subpasta das imagens: dentro de Apresentações do projeto, ou dentro de Avulsos. */
export const IMAGES_FOLDER = 'Imagens';

/**
 * O que o servidor autorizou ao abrir a sessão de envio de uma imagem. Vai assinado para o navegador e
 * volta na conclusão, para o servidor só registrar o arquivo que ele mesmo autorizou. Nada vai para o
 * banco antes da conclusão, então um envio que falha não deixa registro.
 */
export interface ImageGrant {
  presentationId: string;
  folderId: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  userId: string;
  expiresAt: number;
}

export const IMAGE_GRANT_TTL_MS = 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`presentation-image:${payload}`).digest('base64url');
}

export function signImageGrant(grant: ImageGrant, secret: string): string {
  const payload = Buffer.from(JSON.stringify(grant)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyImageGrant(token: unknown, secret: string, now = Date.now()): ImageGrant | null {
  if (typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) return null;
  try {
    const grant = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ImageGrant;
    return grant.expiresAt > now ? grant : null;
  } catch {
    return null;
  }
}

async function childFolder(drive: DriveClient, parentId: string, name: string): Promise<string> {
  return (await drive.findChildFolder(parentId, name)) ?? drive.createFolder(name, parentId);
}

/** Pasta dos PDFs: "<projeto>/Apresentações" ou "De.Croqui ERP/Avulsos", como no orçamento. Criada se faltar. */
export async function presentationsFolderId(db: Db, drive: DriveClient, projectFolderId: string | null): Promise<string> {
  return projectFolderId
    ? projectSubfolderId(drive, projectFolderId, 'presentations')
    : childFolder(drive, await ensureRootFolder(db, drive), LOOSE_BUDGETS_FOLDER);
}

/** Pasta das imagens: "<projeto>/Apresentações/Imagens" ou "De.Croqui ERP/Avulsos/Imagens". Criada no primeiro envio. */
export async function imagesFolderId(db: Db, drive: DriveClient, projectFolderId: string | null): Promise<string> {
  return childFolder(drive, await presentationsFolderId(db, drive, projectFolderId), IMAGES_FOLDER);
}

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** As imagens citadas já não estão disponíveis (foram para a lixeira entre a conferência e a gravação). */
export class ImagesUnavailableError extends Error {
  constructor(readonly ids: string[]) {
    super('imagens indisponíveis');
  }
}

/**
 * Acerta os vínculos da apresentação com as imagens citadas no documento, dentro da transação do
 * salvamento. Devolve as imagens que ficaram sem nenhum vínculo: elas recebem trashed_at na mesma
 * transação (saem da biblioteca) e o chamador as manda para a lixeira do Drive depois do commit.
 */
export async function syncImageUses(tx: Tx, presentationId: string, imageIds: string[]): Promise<{ id: string; driveFileId: string }[]> {
  if (imageIds.length) {
    // Trava as imagens citadas: uma apresentação que esteja liberando a mesma imagem espera esta terminar.
    const available = await tx
      .select({ id: presentationImages.id })
      .from(presentationImages)
      .where(and(inArray(presentationImages.id, imageIds), isNull(presentationImages.trashedAt)))
      .for('update');
    const ok = new Set(available.map((r) => r.id));
    const missing = imageIds.filter((id) => !ok.has(id));
    if (missing.length) throw new ImagesUnavailableError(missing);
  }

  const removed = await tx
    .delete(presentationImageUses)
    .where(
      and(
        eq(presentationImageUses.presentationId, presentationId),
        imageIds.length ? notInArray(presentationImageUses.imageId, imageIds) : undefined,
      ),
    )
    .returning({ imageId: presentationImageUses.imageId });
  if (imageIds.length) {
    await tx
      .insert(presentationImageUses)
      .values(imageIds.map((imageId) => ({ presentationId, imageId })))
      .onConflictDoNothing();
  }
  if (!removed.length) return [];

  // Regra da lixeira: só a imagem que nenhuma apresentação usa mais.
  return tx
    .update(presentationImages)
    .set({ trashedAt: new Date() })
    .where(
      and(
        inArray(
          presentationImages.id,
          removed.map((r) => r.imageId),
        ),
        isNull(presentationImages.trashedAt),
        sql`not exists (select 1 from ${presentationImageUses} where ${presentationImageUses.imageId} = ${presentationImages.id})`,
      ),
    )
    .returning({ id: presentationImages.id, driveFileId: presentationImages.driveFileId });
}

/**
 * Manda para a lixeira do Drive as imagens que ficaram sem uso. Se o Drive falhar, a imagem volta para
 * a biblioteca (trashed_at nulo), para nunca ficar marcada como apagada com o arquivo ainda no Drive.
 * Devolve as que foram para a lixeira.
 */
export async function trashUnusedImages(
  db: Db,
  drive: DriveClient,
  images: { id: string; driveFileId: string }[],
  onError: (err: unknown, imageId: string) => void,
): Promise<string[]> {
  const trashed: string[] = [];
  for (const img of images) {
    try {
      await drive.trashFile(img.driveFileId);
      trashed.push(img.id);
    } catch (err) {
      onError(err, img.id);
      await db
        .update(presentationImages)
        .set({ trashedAt: null })
        .where(
          and(
            eq(presentationImages.id, img.id),
            sql`not exists (select 1 from ${presentationImageUses} where ${presentationImageUses.imageId} = ${presentationImages.id})`,
          ),
        )
        .catch((e: unknown) => onError(e, img.id));
    }
  }
  return trashed;
}
