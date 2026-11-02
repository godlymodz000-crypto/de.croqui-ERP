export type Role = 'admin' | 'member' | 'viewer';
export type Status = 'invited' | 'active' | 'disabled';

export interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: Status;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteInput {
  email: string;
  name: string;
  role: Role;
}

/** Erro da API com o código devolvido pelo back-end (validation, email_taken, last_admin, self...). */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'unknown', data.fields);
  return data as T;
}

export const usersApi = {
  list: () => request<Collaborator[]>('GET', '/users'),
  invite: (input: InviteInput) => request<Collaborator>('POST', '/users', input),
  changeRole: (id: string, role: Role) => request<Collaborator>('PATCH', `/users/${id}/role`, { role }),
  disable: (id: string) => request<Collaborator>('POST', `/users/${id}/disable`),
  remove: (id: string) => request<void>('DELETE', `/users/${id}`),
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  member: 'Colaborador',
  viewer: 'Somente leitura',
};

// Colaborador e Somente leitura: textos do quadro do Figcraft. Administrador: texto novo, no mesmo tom.
export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Faz tudo o que um colaborador faz e também gerencia colaboradores e etapas.',
  member: 'Cria e edita projetos, processos, orçamentos, apresentações e eventos da agenda. Não gerencia colaboradores.',
  viewer: 'Consulta projetos, agenda, orçamentos e apresentações, sem poder alterar nada.',
};

export const STATUS_LABEL: Record<Status, string> = {
  active: 'Ativo',
  invited: 'Convidado',
  disabled: 'Desativado',
};
