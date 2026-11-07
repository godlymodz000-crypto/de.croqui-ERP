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
};
