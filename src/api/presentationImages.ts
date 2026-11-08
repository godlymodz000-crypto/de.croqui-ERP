import { putToDrive } from './files';
import { request } from './http';
import type { PreparedImage } from '../presentation/imageReduce';

/** Imagem da biblioteca: a do projeto ou, na avulsa, a da própria apresentação (E4). */
export interface LibraryImage {
  id: string;
  fileName: string;
  mimeType: string;
  widthPx: number;
  heightPx: number;
  sizeBytes: number;
  createdAt: string;
  createdBy: string | null;
  /** Quantas apresentações usam a imagem agora. */
  usedBy: number;
}

export const presentationImagesApi = {
  library: (presentationId: string) => request<LibraryImage[]>('GET', `/presentations/${presentationId}/images`),
  /** Imagem da visualização (1600 px no lado maior). O PDF usa o original. */
  imageUrl: (imageId: string) => `/api/presentation-images/${imageId}/image`,
  thumbnailUrl: (imageId: string) => `/api/presentation-images/${imageId}/thumbnail`,
};

/**
 * Envia a imagem já reduzida: a API abre a sessão no Drive, o navegador manda o arquivo direto ao Drive
 * (não passa pelo servidor do ERP) e a API confere o arquivo antes de registrar na biblioteca.
 */
export async function uploadPresentationImage(
  presentationId: string,
  image: PreparedImage,
  onProgress: (sent: number) => void,
  signal?: AbortSignal,
): Promise<LibraryImage> {
  const base = `/presentations/${presentationId}/images`;
  const session = await request<{ uploadUrl: string; token: string }>('POST', `${base}/uploads`, {
    name: image.name,
    mimeType: image.type,
    size: image.blob.size,
    width: image.width,
    height: image.height,
  });
  const driveFileId = await putToDrive(session.uploadUrl, new Blob([image.blob], { type: image.type }), onProgress, signal);
  return request<LibraryImage>('POST', `${base}/complete`, { token: session.token, driveFileId });
}
