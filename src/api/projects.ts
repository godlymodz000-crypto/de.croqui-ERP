import { request } from './http';

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
  list: () => request<Project[]>('GET', '/projects'),
  get: (id: string) => request<Project>('GET', `/projects/${id}`),
  create: (input: ProjectInput) => request<Project>('POST', '/projects', input),
  update: (id: string, input: Partial<ProjectInput>) => request<Project>('PATCH', `/projects/${id}`, input),
  remove: (id: string) => request<void>('DELETE', `/projects/${id}`),
};
