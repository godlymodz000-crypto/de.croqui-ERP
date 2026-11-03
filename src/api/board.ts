import { cached, invalidate, mutate, prime, request, TTL } from './http';

export interface Stage {
  id: string;
  name: string;
  position: number;
}

export interface BoardCard {
  id: string;
  name: string;
  clientName: string;
  stageId: string;
  /** AAAA-MM-DD */
  deadline: string | null;
  owner: string | null;
}

export interface Board {
  stages: Stage[];
  projects: BoardCard[];
}

/** Ordem dentro da coluna, igual à do servidor: prazo mais próximo primeiro, sem prazo no fim; prazos iguais por nome. */
export function compareCards(a: Pick<BoardCard, 'deadline' | 'name'>, b: Pick<BoardCard, 'deadline' | 'name'>) {
  if (a.deadline !== b.deadline) {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  }
  return a.name.localeCompare(b.name, 'pt-BR');
}

/** O quadro com um projeto em outra etapa. Usado no movimento local, antes da resposta do servidor. */
export function withCardIn(board: Board, projectId: string, stageId: string): Board {
  return {
    ...board,
    projects: board.projects.map((p) => (p.id === projectId ? { ...p, stageId } : p)).sort(compareCards),
  };
}

// O quadro tem chave própria ('board'): mover um cartão atualiza o quadro guardado sem buscar de novo,
// e só a lista de Projetos (que mostra a etapa) é esquecida.
export const boardApi = {
  /** Etapas e cartões numa leitura só. */
  get: (opts: { force?: boolean } = {}) => cached('board', TTL.projects, () => request<Board>('GET', '/board'), opts),
  /** Guarda o quadro já atualizado na tela, para a próxima visita não buscar de novo. */
  remember: (board: Board) => prime('board', board),
  move: (projectId: string, stageId: string) =>
    mutate(request<{ id: string; stageId: string }>('PATCH', `/projects/${projectId}/stage`, { stageId }), 'projects'),
  createStage: (name: string) => mutate(request<Stage>('POST', '/stages', { name }), 'board'),
  // A lista de Projetos mostra o nome da etapa: renomear também a esquece.
  renameStage: (id: string, name: string) => mutate(request<Stage>('PATCH', `/stages/${id}`, { name }), 'board', 'projects'),
  removeStage: (id: string, destinationStageId: string | null) =>
    mutate(request<void>('DELETE', `/stages/${id}`, destinationStageId ? { destinationStageId } : {}), 'board', 'projects'),
  forget: () => invalidate('board'),
};
