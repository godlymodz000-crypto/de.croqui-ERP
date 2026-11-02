import { ApiError, request } from './http';

export type Subfolder = 'budgets' | 'presentations' | 'contracts' | 'photos';

export const SUBFOLDER_LABEL: Record<Subfolder, string> = {
  photos: 'Fotos',
  contracts: 'Contratos',
  presentations: 'Apresentações',
  budgets: 'Orçamentos',
};

export interface ProjectFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  subfolder: Subfolder;
  source: 'upload' | 'pdf_export';
  createdAt: string;
  uploadedBy: string | null;
  driveFileId: string;
  previewUrl: string;
  driveUrl: string;
  hasThumbnail: boolean;
  pendingDeletion: boolean;
}

export interface ProjectNote {
  id: string;
  body: string;
  createdAt: string;
  author: string | null;
  pendingDeletion: boolean;
}

export type ItemType = 'file' | 'note' | 'project';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface DeletionRequest {
  id: string;
  itemType: ItemType;
  itemId: string;
  itemLabel: string | null;
  itemDetail: string | null;
  itemDeleted: boolean;
  project: { id: string; name: string | null };
  reason: string | null;
  requestedBy: string | null;
  requestedById: string | null;
  status: RequestStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
}

interface UploadSession {
  uploadUrl: string;
  token: string;
  name: string;
}

export const filesApi = {
  list: (projectId: string) => request<ProjectFile[]>('GET', `/projects/${projectId}/files`),
  remove: (id: string) => request<void>('DELETE', `/files/${id}`),
  thumbnailUrl: (id: string) => `/api/files/${id}/thumbnail`,
};

export const notesApi = {
  list: (projectId: string) => request<ProjectNote[]>('GET', `/projects/${projectId}/notes`),
  create: (projectId: string, body: string) => request<ProjectNote>('POST', `/projects/${projectId}/notes`, { body }),
  remove: (id: string) => request<void>('DELETE', `/notes/${id}`),
};

export const deletionApi = {
  request: (itemType: ItemType, itemId: string, reason: string) =>
    request<{ id: string }>('POST', '/deletion-requests', { itemType, itemId, reason }),
  list: (status: RequestStatus) =>
    request<{ requests: DeletionRequest[]; counts: Record<RequestStatus, number> }>('GET', `/deletion-requests?status=${status}`),
  approve: (id: string) => request<void>('POST', `/deletion-requests/${id}/approve`),
  reject: (id: string) => request<void>('POST', `/deletion-requests/${id}/reject`),
};

/** Erro no envio direto ao Drive (rede, cancelamento ou resposta do Google). */
export class UploadError extends Error {
  constructor(public reason: 'aborted' | 'network' | 'drive') {
    super(reason);
  }
}

/**
 * Envia o arquivo direto do navegador para o Drive, na sessão aberta pelo servidor.
 * O arquivo não passa pelo servidor do ERP (limite de cerca de 4,5 MB por requisição na Vercel).
 */
function putToDrive(uploadUrl: string, file: Blob, onProgress: (sent: number) => void, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { id?: string };
        if (xhr.status >= 200 && xhr.status < 300 && body.id) return resolve(body.id);
      } catch {
        // resposta sem JSON: tratada abaixo
      }
      reject(new UploadError('drive'));
    };
    xhr.onerror = () => reject(new UploadError('network'));
    xhr.onabort = () => reject(new UploadError('aborted'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

async function sendThroughSession(
  base: string,
  session: UploadSession,
  file: Blob,
  onProgress: (sent: number) => void,
  signal?: AbortSignal,
): Promise<ProjectFile> {
  const driveFileId = await putToDrive(session.uploadUrl, file, onProgress, signal);
  return request<ProjectFile>('POST', `${base}/complete`, { token: session.token, driveFileId });
}

export async function uploadFile(
  projectId: string,
  file: File,
  subfolder: 'photos' | 'contracts',
  onProgress: (sent: number) => void,
  signal?: AbortSignal,
): Promise<ProjectFile> {
  const base = `/projects/${projectId}/uploads`;
  const session = await request<UploadSession>('POST', base, { name: file.name, mimeType: file.type, size: file.size, subfolder });
  return sendThroughSession(base, session, file, onProgress, signal);
}

/**
 * Salva no Drive o PDF exportado no editor ("Orçamentos" ou "Apresentações"), com o nome
 * "<Tipo> - <Projeto> - <data>.pdf". Os editores chegam na Fase 6 e usam esta função ao exportar.
 */
export async function savePdfExport(
  projectId: string,
  kind: 'budget' | 'presentation',
  pdf: Blob,
  onProgress: (sent: number) => void = () => {},
): Promise<ProjectFile> {
  const base = `/projects/${projectId}/exports`;
  const session = await request<UploadSession>('POST', base, { kind, size: pdf.size });
  return sendThroughSession(base, session, new Blob([pdf], { type: 'application/pdf' }), onProgress);
}

export { ApiError };

/** "6,4 MB", "412 KB" */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "PDF", "JPG": a extensão em maiúsculas, para a miniatura e a linha de detalhes. */
export function fileKind(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  return ext.slice(0, 4).toUpperCase() || 'ARQ';
}
