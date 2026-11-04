import type { SessionUser } from '../../session';

// A interface só esconde os controles; quem protege os dados é o back-end (documents.write e documents.export).
export const canWriteBudgets = (user: SessionUser | null) => user?.role === 'admin' || user?.role === 'member';
export const canExportBudgets = canWriteBudgets;

/** "14:32", na hora local. */
export function clock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
