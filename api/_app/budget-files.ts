/** Nome e data do PDF do orçamento no Drive. */
import { sha256 } from './crypto.js';

/** Pasta dos PDFs de orçamentos sem projeto, dentro de "De.Croqui ERP". */
export const LOOSE_BUDGETS_FOLDER = 'Avulsos';

/** Texto seguro para nome de arquivo: sem acentos, só letras, números e hífen. */
export function fileSlug(text: string, max = 60): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
  return slug || 'Sem-nome';
}

/** Data de hoje (AAAA-MM-DD) no fuso do estúdio. */
export function todayInStudio(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

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
