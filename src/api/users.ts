import { mutate, request } from './http';

export { ApiError } from './http';

export type Role = 'admin' | 'member' | 'viewer';
export type Status = 'invited' | 'active' | 'disabled';
/** Acesso de leitor à pasta "De.Croqui ERP" (ver api/_app/routes/users.ts). */
export type DriveAccess = 'owner' | 'reader' | 'missing' | 'revoke_pending' | 'none';

export interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: Status;
  lastLoginAt: string | null;
  createdAt: string;
  driveAccess: DriveAccess;
}

export interface InviteInput {
  email: string;
  name: string;
  role: Role;
}

export const usersApi = {
  list: () => request<Collaborator[]>('GET', '/users'),
  // Quem recebe comunicado depende de papel e situação: essas gravações esquecem a lista de destinatários.
  invite: (input: InviteInput) => mutate(request<Collaborator>('POST', '/users', input), 'broadcasts/audience'),
  changeRole: (id: string, role: Role) => mutate(request<Collaborator>('PATCH', `/users/${id}/role`, { role }), 'broadcasts/audience'),
  disable: (id: string) => mutate(request<Collaborator>('POST', `/users/${id}/disable`), 'broadcasts/audience'),
  remove: (id: string) => mutate(request<void>('DELETE', `/users/${id}`), 'broadcasts/audience'),
  /** Tenta de novo compartilhar (ou revogar) a pasta do Drive. */
  retryDrive: (id: string) => request<Collaborator>('POST', `/users/${id}/drive-access`),
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
