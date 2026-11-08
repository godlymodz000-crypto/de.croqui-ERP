/** Nome e data do PDF do orçamento no Drive. */
import { sha256 } from './crypto.js';
import { fileSlug, todayInStudio } from '../../src/shared/file-names.js';

/** Pasta dos PDFs de orçamentos sem projeto, dentro de "De.Croqui ERP". */
export const LOOSE_BUDGETS_FOLDER = 'Avulsos';

// Nome seguro e data de hoje vêm do módulo compartilhado com a tela (o diálogo da 6b mostra o nome antes de gerar).
export { fileSlug, todayInStudio };

/**
 * "Orcamento-12-Sala-de-Jantar-2026-11-04.pdf": número do orçamento, nome e data de emissão (a Data
 * preenchida no orçamento; sem ela, a de hoje). A partir da segunda exportação entra a versão: "-v2".
 */
export function budgetPdfName({ name, number, issueDate, version }: { name: string; number: number; issueDate: string; version: number }): string {
  return `Orcamento-${number}-${fileSlug(name)}-${issueDate}${version > 1 ? `-v${version}` : ''}.pdf`;
}

/** JSON com as chaves de todo objeto em ordem alfabética. Listas mantêm a ordem (a ordem dos ambientes conta). */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalJson(v))).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * Impressão digital do que entra no PDF: conteúdo do orçamento, nome, projeto e número. Igual ao da última
 * exportação, o PDF sairia igual, e a rota não gera outro.
 */
export function budgetSourceHash(input: { data: unknown; name: string; projectId: string | null; number: number }): string {
  return sha256(canonicalJson({ data: input.data, name: input.name, projectId: input.projectId, number: input.number }));
}
