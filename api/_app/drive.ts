import { eq } from 'drizzle-orm';
import { AdminTokenError, createAdminAccessToken } from './admin-token.js';
import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { appSettings, type Subfolder } from './db/schema.js';

const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export const ROOT_FOLDER_NAME = 'De.Croqui ERP';
export const PROJECTS_FOLDER_NAME = 'Projetos';
export const PROJECT_SUBFOLDERS = ['Orçamentos', 'Apresentações', 'Contratos', 'Fotos', 'Arquivos'] as const;

const ROOT_KEY = 'drive_root_folder_id';
const PROJECTS_KEY = 'drive_projects_folder_id';

export class DriveError extends Error {}

/** Operações do Drive que o ERP usa. Substituível nos testes. */
export interface DriveClient {
  createFolder(name: string, parentId: string | null): Promise<string>;
  renameFolder(id: string, name: string): Promise<void>;
  /** A pasta existe e não está na lixeira. */
  folderExists(id: string): Promise<boolean>;
  /** Move para a lixeira (recuperável por 30 dias). Ao excluir projeto e ao desfazer uma criação que falhou no meio. */
  trashFolder(id: string): Promise<void>;
  /** ID da subpasta com esse nome dentro de `parentId`, se existir e não estiver na lixeira. */
  findChildFolder(parentId: string, name: string): Promise<string | null>;
  /**
   * Abre uma sessão de upload retomável e devolve o endereço para onde o navegador envia o arquivo.
   * Com `origin`, o Google libera o envio direto daquele endereço (CORS).
   */
  createUploadSession(input: { name: string; mimeType: string; size: number; parentId: string; origin: string }): Promise<string>;
  getFile(id: string): Promise<DriveFile | null>;
  /** Envia um arquivo gerado no servidor (PDF do orçamento) para a pasta, numa chamada só. */
  uploadFile(input: { name: string; mimeType: string; parentId: string; body: Uint8Array }): Promise<DriveFile>;
  /** Move o arquivo para a lixeira do Drive (recuperável por 30 dias). */
  trashFile(id: string): Promise<void>;
  /** Imagem gerada pelo Drive com o lado maior em `size` px (miniatura ou visualização grande), quando existe. */
  thumbnail(id: string, size?: number): Promise<Image | null>;
  /** Conteúdo do arquivo, só quando cabe em `maxBytes`. Usado quando o Drive não gera a imagem. */
  download(id: string, maxBytes: number): Promise<Image | null>;
  /** Compartilha a pasta como leitor com o e-mail, sem e-mail do Google. Devolve o ID da permissão. */
  shareReader(folderId: string, email: string): Promise<string>;
  /** Revoga só aquela permissão. Permissão que já não existe conta como revogada. */
  revokePermission(folderId: string, permissionId: string): Promise<void>;
}

export interface Image {
  contentType: string;
  body: ArrayBuffer;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  parents: string[];
  trashed: boolean;
}

export const SUBFOLDER_NAMES: Record<Subfolder, (typeof PROJECT_SUBFOLDERS)[number]> = {
  budgets: 'Orçamentos',
  presentations: 'Apresentações',
  contracts: 'Contratos',
  photos: 'Fotos',
  files: 'Arquivos',
};

export function fileViewUrl(id: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
}

/** Aspas simples e barras invertidas escapadas para a consulta `q` do Drive. */
function qString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function folderUrl(id: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
}

export function projectFolderName(clientName: string, projectName: string): string {
  return `${clientName} - ${projectName}`;
}

/**
 * Todas as escritas no Drive usam o token do administrador (ADMIN_EMAIL), guardado criptografado.
 * Assim os arquivos ficam numa conta só. Quem pode fazer o quê é checado antes, no ERP (seção 5).
 */
export function createAdminDrive({ config, db, fetch: doFetch = fetch }: { config: Config; db: Db; fetch?: typeof fetch }): DriveClient {
  const token = createAdminAccessToken({ config, db, fetch: doFetch });

  async function accessToken(): Promise<string> {
    try {
      return await token.accessToken();
    } catch (err) {
      throw err instanceof AdminTokenError ? new DriveError(err.message) : err;
    }
  }

  async function call(url: string, init: RequestInit = {}): Promise<Response> {
    const res = await doFetch(url, {
      ...init,
      headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json', ...init.headers },
    });
    if (res.status === 401) token.forget();
    return res;
  }

  return {
    async createFolder(name, parentId) {
      const res = await call(`${FILES_ENDPOINT}?fields=id`, {
        method: 'POST',
        body: JSON.stringify({ name, mimeType: FOLDER_MIME, ...(parentId ? { parents: [parentId] } : {}) }),
      });
      if (!res.ok) throw new DriveError(`Criação da pasta falhou (${res.status}).`);
      const { id } = (await res.json()) as { id?: string };
      if (!id) throw new DriveError('Resposta do Drive sem ID da pasta.');
      return id;
    },

    async renameFolder(id, name) {
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?fields=id`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new DriveError(`Renomear a pasta falhou (${res.status}).`);
    },

    async folderExists(id) {
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?fields=id,trashed`);
      if (res.status === 404) return false;
      if (!res.ok) throw new DriveError(`Consulta da pasta falhou (${res.status}).`);
      const { trashed } = (await res.json()) as { trashed?: boolean };
      return !trashed;
    },

    async trashFolder(id) {
      await trash(id);
    },

    async trashFile(id) {
      await trash(id);
    },

    async findChildFolder(parentId, name) {
      const q = `${qString(parentId)} in parents and name = ${qString(name)} and mimeType = '${FOLDER_MIME}' and trashed = false`;
      const res = await call(`${FILES_ENDPOINT}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`);
      if (!res.ok) throw new DriveError(`Busca da subpasta falhou (${res.status}).`);
      const { files } = (await res.json()) as { files?: { id: string }[] };
      return files?.[0]?.id ?? null;
    },

    async createUploadSession({ name, mimeType, size, parentId, origin }) {
      const res = await call(`${UPLOAD_ENDPOINT}?uploadType=resumable&fields=id,name,mimeType,size`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=UTF-8',
          'x-upload-content-type': mimeType,
          'x-upload-content-length': String(size),
          origin,
        },
        body: JSON.stringify({ name, mimeType, parents: [parentId] }),
      });
      const location = res.headers.get('location');
      if (!res.ok || !location) throw new DriveError(`Abertura da sessão de upload falhou (${res.status}).`);
      return location;
    },

    async uploadFile({ name, mimeType, parentId, body }) {
      // Upload multipart: metadados e conteúdo no mesmo pedido. Serve para arquivos de até 5 MB.
      const boundary = `erp-${crypto.randomUUID()}`;
      const head = `--${boundary}
content-type: application/json; charset=UTF-8

${JSON.stringify({ name, mimeType, parents: [parentId] })}
--${boundary}
content-type: ${mimeType}

`;
      const res = await call(`${UPLOAD_ENDPOINT}?uploadType=multipart&fields=id,name,mimeType,size,parents,trashed`, {
        method: 'POST',
        headers: { 'content-type': `multipart/related; boundary=${boundary}` },
        body: new Blob([head, body as Uint8Array<ArrayBuffer>, `
--${boundary}--`]),
      });
      if (!res.ok) throw new DriveError(`Envio do arquivo falhou (${res.status}).`);
      const f = (await res.json()) as Omit<DriveFile, 'size'> & { size?: string };
      if (!f.id) throw new DriveError('Resposta do Drive sem ID do arquivo.');
      return { ...f, size: Number(f.size ?? body.byteLength), parents: f.parents ?? [parentId], trashed: !!f.trashed };
    },

    async getFile(id) {
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?fields=id,name,mimeType,size,parents,trashed`);
      if (res.status === 404) return null;
      if (!res.ok) throw new DriveError(`Consulta do arquivo falhou (${res.status}).`);
      const f = (await res.json()) as Omit<DriveFile, 'size'> & { size?: string };
      return { ...f, size: Number(f.size ?? 0), parents: f.parents ?? [], trashed: !!f.trashed };
    },

    async thumbnail(id, size = 220) {
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?fields=thumbnailLink`);
      if (!res.ok) return null;
      const { thumbnailLink } = (await res.json()) as { thumbnailLink?: string };
      if (!thumbnailLink) return null;
      // O link termina em "=s220"; trocar o número pede a mesma imagem em outro tamanho.
      const sized = /=s\d+$/.test(thumbnailLink) ? thumbnailLink.replace(/=s\d+$/, `=s${size}`) : thumbnailLink;
      const img = await doFetch(sized, { headers: { authorization: `Bearer ${await accessToken()}` } });
      if (!img.ok) return null;
      return { contentType: img.headers.get('content-type') ?? 'image/jpeg', body: await img.arrayBuffer() };
    },

    async download(id, maxBytes) {
      const meta = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?fields=size,mimeType`);
      if (!meta.ok) return null;
      const { size, mimeType } = (await meta.json()) as { size?: string; mimeType?: string };
      if (!size || Number(size) > maxBytes) return null;
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?alt=media`);
      if (!res.ok) return null;
      return { contentType: mimeType ?? 'application/octet-stream', body: await res.arrayBuffer() };
    },

    async shareReader(folderId, email) {
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(folderId)}/permissions?sendNotificationEmail=false&fields=id`, {
        method: 'POST',
        body: JSON.stringify({ type: 'user', role: 'reader', emailAddress: email }),
      });
      if (!res.ok) throw new DriveError(`Compartilhar a pasta falhou (${res.status}).`);
      const { id } = (await res.json()) as { id?: string };
      if (!id) throw new DriveError('Resposta do Drive sem ID da permissão.');
      return id;
    },

    async revokePermission(folderId, permissionId) {
      const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(folderId)}/permissions/${encodeURIComponent(permissionId)}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new DriveError(`Revogar o acesso falhou (${res.status}).`);
    },
  };

  async function trash(id: string) {
    const res = await call(`${FILES_ENDPOINT}/${encodeURIComponent(id)}?fields=id`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: true }),
    });
    // 404: já não existe no Drive (apagado por fora); não há o que mover.
    if (!res.ok && res.status !== 404) throw new DriveError(`Mover para a lixeira falhou (${res.status}).`);
  }
}

/** ID da subpasta padrão do projeto. Se alguém a apagou no Drive, ela é criada de novo. */
export async function projectSubfolderId(drive: DriveClient, projectFolderId: string, subfolder: Subfolder): Promise<string> {
  const name = SUBFOLDER_NAMES[subfolder];
  return (await drive.findChildFolder(projectFolderId, name)) ?? drive.createFolder(name, projectFolderId);
}

async function readSetting(db: Db, key: string): Promise<string | null> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key));
  return row?.value ?? null;
}

async function writeSetting(db: Db, key: string, value: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

/** Garante "De.Croqui ERP/Projetos" e devolve o ID de "Projetos". Na primeira vez cria as duas e guarda os IDs. */
export async function ensureProjectsFolder(db: Db, drive: DriveClient): Promise<string> {
  const stored = await readSetting(db, PROJECTS_KEY);
  if (stored && (await drive.folderExists(stored))) return stored;

  let rootId = await readSetting(db, ROOT_KEY);
  if (!rootId || !(await drive.folderExists(rootId))) {
    rootId = await drive.createFolder(ROOT_FOLDER_NAME, null);
    await writeSetting(db, ROOT_KEY, rootId);
  }
  const projectsId = await drive.createFolder(PROJECTS_FOLDER_NAME, rootId);
  await writeSetting(db, PROJECTS_KEY, projectsId);
  return projectsId;
}

/** Cria "<cliente> - <projeto>" com as subpastas padrão. Se algo falhar no meio, a pasta parcial vai para a lixeira. */
export async function createProjectFolder(db: Db, drive: DriveClient, clientName: string, projectName: string): Promise<string> {
  const parentId = await ensureProjectsFolder(db, drive);
  const folderId = await drive.createFolder(projectFolderName(clientName, projectName), parentId);
  try {
    for (const sub of PROJECT_SUBFOLDERS) await drive.createFolder(sub, folderId);
  } catch (err) {
    await drive.trashFolder(folderId).catch(() => {});
    throw err;
  }
  return folderId;
}

export async function driveRootFolderId(db: Db): Promise<string | null> {
  return readSetting(db, ROOT_KEY);
}

/** ID de "De.Croqui ERP", criando a estrutura se ainda não existir (o convite pode vir antes do primeiro projeto). */
export async function ensureRootFolder(db: Db, drive: DriveClient): Promise<string> {
  await ensureProjectsFolder(db, drive);
  return (await readSetting(db, ROOT_KEY))!;
}
