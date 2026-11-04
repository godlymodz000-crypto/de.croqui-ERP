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
};
