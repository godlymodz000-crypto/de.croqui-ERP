/** Nome e data do PDF do orçamento no Drive. */

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
