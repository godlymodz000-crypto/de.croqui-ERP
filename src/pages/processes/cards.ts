const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Hoje no fuso de quem usa, como AAAA-MM-DD, para comparar com o prazo sem passar por UTC. */
export function todayIso(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** "3 nov", a partir de AAAA-MM-DD. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Prazo do cartão: "Prazo 3 nov", ou atrasado quando o dia já passou. Sem prazo, nada. */
export function cardDeadline(deadline: string | null, today = todayIso()): { text: string; overdue: boolean } | null {
  if (!deadline) return null;
  const overdue = deadline < today;
  return { text: overdue ? `Atrasado · ${shortDate(deadline)}` : `Prazo ${shortDate(deadline)}`, overdue };
}

/** Iniciais do responsável no avatar: "Joana Vieira" vira "JV"; e-mail usa a primeira letra. */
export function initials(owner: string | null): string {
  if (!owner) return '';
  const words = owner.includes('@') ? [owner] : owner.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

/** Tons das colunas, na ordem dos quadros do Figcraft. Etapas a mais repetem a sequência. */
export const STAGE_TONES = 7;

/** "Casa Loureiro e Sítio Itaipava", "A, B e C" ou "Os 5 projetos" para listas longas. */
export function projectList(names: string[]): string {
  if (names.length > 3) return `Os ${names.length} projetos`;
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}
