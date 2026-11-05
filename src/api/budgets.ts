import { cached, mutate, request, TTL } from './http';
import type { BudgetData } from '../shared/budget-calc';

export type { BudgetData, BudgetRoom } from '../shared/budget-calc';

export interface Budget {
  id: string;
  number: number;
  name: string;
  status: 'draft' | 'sent';
  projectId: string | null;
  project: { id: string; name: string; clientName: string } | null;
  clientName: string | null;
  totalCents: number;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  /** PDF mais recente salvo no Drive. Os anteriores continuam no Drive, com versão menor no nome. */
  pdf: BudgetPdf | null;
}

export interface BudgetPdf {
  driveFileId: string;
  name: string;
  version: number;
  exportedAt: string;
  url: string;
}

export interface BudgetWithData extends Budget {
  data: BudgetData;
}

export const budgetsApi = {
  list: () => cached('budgets', TTL.budgets, () => request<Budget[]>('GET', '/budgets')),
  get: (id: string) => request<BudgetWithData>('GET', `/budgets/${id}`),
  create: (input: { name: string; projectId: string | null }) => mutate(request<BudgetWithData>('POST', '/budgets', input), 'budgets'),
  /** Salvamento automático. `baseUpdatedAt` é a versão que a tela tem; outra mais nova responde 409. */
  save: (id: string, input: { data?: BudgetData; name?: string; baseUpdatedAt?: string }) =>
    mutate(request<BudgetWithData>('PATCH', `/budgets/${id}`, input), 'budgets'),
  /** "Salvar em PDF": o servidor gera com o que está gravado e envia ao Drive. Cada chamada cria uma versão nova. */
  exportPdf: (id: string) => mutate(request<{ file: BudgetPdf & { pages: number }; budget: BudgetWithData }>('POST', `/budgets/${id}/pdf`), 'budgets'),
};
