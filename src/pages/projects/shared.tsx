import { Badge } from '../../ui/ds';
import type { SessionUser } from '../../session';
import type { Project } from '../../api/projects';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "15 dez 2026", a partir de AAAA-MM-DD, sem passar por fuso horário. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function deadlineLabel(p: Project): string {
  return p.deadline ? `Prazo · ${formatDate(p.deadline)}` : 'Sem prazo definido';
}

export function folderName(p: Pick<Project, 'clientName' | 'name'>): string {
  return `${p.clientName} - ${p.name}`;
}

// A interface só esconde botões; quem protege os dados é o back-end (seção 5).
export const canWriteProjects = (user: SessionUser | null) => user?.role === 'admin' || user?.role === 'member';
export const canDeleteProjects = (user: SessionUser | null) => user?.role === 'admin';

/** Etapa com contorno, como no quadro; projeto concluído com fundo. */
export function SituationBadge({ project }: { project: Project }) {
  if (project.status === 'done') return <Badge tone="neutral">Concluído</Badge>;
  return (
    <Badge tone="neutral" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--border-default)' }}>
      {project.stage?.name ?? 'Sem etapa'}
    </Badge>
  );
}
