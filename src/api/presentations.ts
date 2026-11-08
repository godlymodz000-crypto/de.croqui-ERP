import { cached, mutate, request, TTL } from './http';
import type { PresentationData } from '../shared/presentation-data';

export type { PresentationData } from '../shared/presentation-data';

export interface Presentation {
  id: string;
  number: number;
  name: string;
  projectId: string | null;
  project: { id: string; name: string; clientName: string } | null;
  /** Cliente da aba Projeto da apresentação; sem ele, o cliente do projeto. */
  clientName: string | null;
  pageCount: number;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  /** PDF mais recente salvo no Drive (a partir da E9). */
  pdf: PresentationPdf | null;
}

export interface PresentationPdf {
  driveFileId: string;
  name: string | null;
  version: number;
  exportedAt: string | null;
  url: string;
}

export interface PresentationWithData extends Presentation {
  data: PresentationData;
}

export const presentationsApi = {
  list: () => cached('presentations', TTL.presentations, () => request<Presentation[]>('GET', '/presentations')),
  get: (id: string) => request<PresentationWithData>('GET', `/presentations/${id}`),
  /** "Nova apresentação": nasce só com a capa; com projeto, copia nome e cliente como texto editável. */
  create: (input: { name: string; projectId: string | null }) =>
    mutate(request<PresentationWithData>('POST', '/presentations', input), 'presentations'),
  /**
   * Salvamento automático do documento. `baseUpdatedAt` é a versão que a tela tem: outra mais nova
   * responde 409; documento acima de 512 KB responde 413 `too_large`.
   */
  /**
   * Vincula a apresentação avulsa a um projeto (E5): imagens e PDF mudam de pasta no Drive. Se o Drive falhar,
   * responde 502 `drive_failed` com `rolledBack` dizendo se os arquivos já movidos voltaram.
   */
  link: (id: string, projectId: string) =>
    mutate(request<Presentation>('POST', `/presentations/${id}/link`, { projectId }), 'presentations'),
  save: (id: string, input: { data: PresentationData; baseUpdatedAt: string; name?: string }) =>
    mutate(request<PresentationWithData>('PATCH', `/presentations/${id}`, input), 'presentations'),
  /**
   * "Salvar em PDF" (E9): o servidor gera com o que está gravado e salva no Drive. Sem mudança desde o último
   * PDF responde 409 `no_changes` com o arquivo atual; conteúdo além do limite da página, 422 `content_overflow`.
   */
  exportPdf: (id: string) =>
    mutate(
      request<{ file: PresentationPdf & { pages: number }; presentation: PresentationWithData }>('POST', `/presentations/${id}/pdf`),
      'presentations',
    ),
};
