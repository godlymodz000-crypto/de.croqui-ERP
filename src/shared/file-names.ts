// Nomes de arquivo dos PDFs exportados (Fase 6a e 6b). Módulo puro: o servidor dá o nome ao arquivo no Drive
// e a tela mostra o mesmo nome no diálogo de exportar (6b-11) antes de gerar.

/** Texto seguro para nome de arquivo: sem acentos, só letras, números e hífen. */
export function fileSlug(text: string, max = 60): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

/** AAAA-MM-DD de um dia que existe no calendário. */
export function isCalendarDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/** Data do nome do PDF (P7): a data de emissão quando é uma data válida; sem ela, a de hoje no fuso do estúdio. */
export function pdfIssueDate(issueDate: string | null | undefined, now: Date): string {
  return issueDate && isCalendarDate(issueDate) ? issueDate : todayInStudio(now);
}

/**
 * "Apresentacao-3-Apresentacao-do-anteprojeto-2026-11-07.pdf": número, nome e data de emissão, no padrão do
 * orçamento. A partir da segunda exportação entra a versão: "-v2".
 */
export function presentationPdfName({ name, number, issueDate, version }: { name: string; number: number; issueDate: string; version: number }): string {
  return `Apresentacao-${number}-${fileSlug(name)}-${issueDate}${version > 1 ? `-v${version}` : ''}.pdf`;
}
