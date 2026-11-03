import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from './db/schema.js';

/**
 * Matriz da seção 5 da especificação. É a fonte da verdade das permissões no back-end:
 * toda rota de escrita declara uma destas ações em `config.permission` (ver app.ts).
 * Decisões tomadas para os itens [CONFIRMAR]: etapas e exclusão de projeto só admin;
 * exportar PDF não é permitido para somente leitura.
 */
export const PERMISSIONS = {
  /** Ver colaboradores */
  'users.read': ['admin'],
  /** Convidar, alterar papel, desativar e remover colaborador */
  'users.manage': ['admin'],
  /** Ver projetos, processos, agenda e dashboard */
  'workspace.read': ['admin', 'member', 'viewer'],
  /** Criar e editar projetos */
  'projects.write': ['admin', 'member'],
  /** Arrastar projeto no Kanban (mudar etapa) */
  'projects.move': ['admin', 'member'],
  /** Criar e editar eventos (ERP) */
  'events.write': ['admin', 'member'],
  /** Conectar e desconectar o Google Agenda do estúdio (calendário na conta do administrador) */
  'calendar.connect': ['admin'],
  /** Criar, renomear e remover etapas */
  'stages.manage': ['admin'],
  /** Excluir projeto */
  'projects.delete': ['admin'],
  /** Criar e editar orçamento e apresentação */
  'documents.write': ['admin', 'member'],
  /** Exportar PDF de orçamento e apresentação (e salvar o PDF na pasta do projeto) */
  'documents.export': ['admin', 'member'],
  /** Enviar arquivos e criar notas no projeto */
  'content.write': ['admin', 'member'],
  /** Pedir a exclusão de arquivo, nota ou projeto */
  'deletion.request': ['admin', 'member'],
  /** Excluir arquivo ou nota diretamente (projeto: projects.delete) */
  'content.delete': ['admin'],
  /** Ver, aprovar e recusar pedidos de exclusão */
  'deletion.decide': ['admin'],
  /** Ler e marcar como lidas as próprias notificações (cada um só as suas) */
  'notifications.own': ['admin', 'member', 'viewer'],
  /** Enviar comunicado e ver os comunicados enviados */
  'notifications.send': ['admin'],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

/** Middleware de autorização: recusa com 403 quando o papel do usuário não está entre os exigidos. */
export function requireRole(roles: readonly UserRole[]) {
  return async function authorize(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || !roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'forbidden' });
    }
  };
}

export function requirePermission(permission: Permission) {
  return requireRole(PERMISSIONS[permission]);
}
