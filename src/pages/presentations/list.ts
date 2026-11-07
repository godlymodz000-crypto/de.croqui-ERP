import type { SessionUser } from '../../session';
import type { Presentation } from '../../api/presentations';

// Regras da lista de apresentações (desenhos 6b-01 e 6b-13), separadas da tela para os testes.

// A interface só esconde os controles; quem protege os dados é o back-end (documents.write).
export const canWritePresentations = (user: SessionUser | null) => user?.role === 'admin' || user?.role === 'member';

export type Tab = 'todas' | 'projeto' | 'sem-projeto';
export const TABS: { value: Tab; label: string; short: string }[] = [
  { value: 'todas', label: 'Todas', short: 'Todas' },
  { value: 'projeto', label: 'Por projeto', short: 'Projetos' },
  { value: 'sem-projeto', label: 'Sem projeto', short: 'Sem projeto' },
];

export type Sort = 'updated' | 'name' | 'number';
export const SORTS: { value: Sort; label: string }[] = [
  { value: 'updated', label: 'última alteração' },
  { value: 'name', label: 'nome da apresentação' },
  { value: 'number', label: 'número' },
];

export const tabFrom = (value: string | null): Tab => TABS.find((t) => t.value === value)?.value ?? 'todas';
export const sortFrom = (value: string | null): Sort => SORTS.find((s) => s.value === value)?.value ?? 'updated';

export function countByTab(list: Presentation[]): Record<Tab, number> {
  const withProject = list.filter((p) => p.projectId).length;
  return { todas: list.length, projeto: withProject, 'sem-projeto': list.length - withProject };
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Filtra pela aba e ordena. Última alteração e número: o mais recente primeiro; nome: de A a Z. */
export function visiblePresentations(list: Presentation[], tab: Tab, sort: Sort): Presentation[] {
  const filtered = list.filter((p) => tab === 'todas' || (tab === 'projeto' ? !!p.projectId : !p.projectId));
  return [...filtered].sort((a, b) => {
    if (sort === 'name') return collator.compare(a.name, b.name) || b.number - a.number;
    if (sort === 'number') return b.number - a.number;
    return b.updatedAt.localeCompare(a.updatedAt) || b.number - a.number;
  });
}

/** "1 página", "3 páginas". */
export const pagesLabel = (n: number) => `${n} ${n === 1 ? 'página' : 'páginas'}`;

/** Segunda linha da apresentação no computador: "Nº 3 · 1 página". */
export const subLine = (p: Presentation) => `Nº ${p.number} · ${pagesLabel(p.pageCount)}`;

/** No celular, a coluna Cliente some: "Nº 1 · Cliente". Sem cliente, fica só o número. */
export const mobileSubLine = (p: Presentation) => (p.clientName ? `Nº ${p.number} · ${p.clientName}` : `Nº ${p.number}`);

/** Mensagem da aba sem apresentações, quando a lista tem outras. */
export const emptyTabMessage = (tab: Tab) =>
  tab === 'sem-projeto' ? 'Nenhuma apresentação sem projeto.' : 'Nenhuma apresentação de projeto.';
