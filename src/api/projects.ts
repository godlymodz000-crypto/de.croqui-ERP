import { cached, mutate, request, TTL } from './http';
import type { ProjectFile, ProjectNote } from './files';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  stage: { id: string; name: string } | null;
  status: 'active' | 'done';
  /** AAAA-MM-DD */
  deadline: string | null;
  driveFolderId: string;
  driveUrl: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ProjectInput {
  name: string;
  clientName: string;
  deadline: string | null;
}

export const projectsApi = {
  /** A mesma lista serve à tela de Projetos e às opções de link do painel de comunicado. */
  list: () => cached('projects', TTL.projects, () => request<Project[]>('GET', '/projects')),
  get: (id: string) => request<Project>('GET', `/projects/${id}`),
  /** Tela do projeto numa leitura só: projeto, arquivos e notas. */
  page: (id: string) => request<{ project: Project; files: ProjectFile[]; notes: ProjectNote[] }>('GET', `/projects/${id}/page`),
  // O quadro de Processos mostra nome, cliente e prazo: toda gravação de projeto o esquece também.
  create: (input: ProjectInput) => mutate(request<Project>('POST', '/projects', input), 'projects', 'board'),
  update: (id: string, input: Partial<ProjectInput>) => mutate(request<Project>('PATCH', `/projects/${id}`, input), 'projects', 'board'),
  remove: (id: string) => mutate(request<void>('DELETE', `/projects/${id}`), 'projects', 'board'),
};
