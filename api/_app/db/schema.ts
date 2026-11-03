import { sql } from 'drizzle-orm';
import { bigint, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'member', 'viewer']);
export const userStatus = pgEnum('user_status', ['invited', 'active', 'disabled']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleSub: text('google_sub').unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: userRole('role').notNull().default('viewer'),
  status: userStatus('status').notNull().default('invited'),
  // Refresh token do Google, sempre criptografado com TOKEN_ENCRYPTION_KEY (ver crypto.ts).
  googleRefreshToken: text('google_refresh_token'),
  // Permissão de leitor na pasta "De.Croqui ERP", criada no convite. Guardada para revogar só ela depois.
  drivePermissionId: text('drive_permission_id'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    // Hash SHA-256 do token guardado no cookie. O token em si nunca vai para o banco.
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Quem fez a ação. Fica nulo se essa conta for removida depois; o histórico continua.
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_log_entity_idx').on(t.entity, t.entityId), index('audit_log_at_idx').on(t.at)],
);

/** Etapas do Kanban. As sete padrão entram pela migração; a tela de etapas é da Fase 4. */
export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Exclusão lógica (seção 4).
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const projectStatus = pgEnum('project_status', ['active', 'done']);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    clientName: text('client_name').notNull(),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id),
    // Quem criou. Fica nulo se essa conta for removida; o projeto continua.
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    // Pasta "<cliente> - <projeto>" no Drive do administrador. Renomear não troca o ID.
    driveFolderId: text('drive_folder_id').notNull(),
    deadline: date('deadline'),
    status: projectStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    // Exclusão lógica: some do ERP, a pasta no Drive continua.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('projects_stage_id_idx').on(t.stageId), index('projects_updated_at_idx').on(t.updatedAt)],
);

/** Configurações do sistema guardadas no banco, como os IDs das pastas raiz do Drive. */
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Subpastas padrão da pasta do projeto no Drive (ver drive.ts). */
export const projectSubfolder = pgEnum('project_subfolder', ['budgets', 'presentations', 'contracts', 'photos', 'files']);
/** upload: enviado pela tela do projeto; pdf_export: PDF salvo ao exportar no editor. */
export const fileSource = pgEnum('file_source', ['upload', 'pdf_export']);

/** Metadados dos arquivos do projeto. O arquivo em si fica no Drive do administrador. */
export const projectFiles = pgTable(
  'project_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    driveFileId: text('drive_file_id').notNull().unique(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    subfolder: projectSubfolder('subfolder').notNull(),
    source: fileSource('source').notNull().default('upload'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Exclusão lógica; o arquivo vai para a lixeira do Drive.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('project_files_project_id_idx').on(t.projectId)],
);

/** Notas do projeto. Ficam só no banco, não vão para o Drive. */
export const projectNotes = pgTable(
  'project_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    body: text('body').notNull(),
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('project_notes_project_id_idx').on(t.projectId)],
);

export const deletionItemType = pgEnum('deletion_item_type', ['file', 'note', 'project']);
export const deletionStatus = pgEnum('deletion_status', ['pending', 'approved', 'rejected']);

/** Pedidos de exclusão: colaborador pede, administrador aprova ou recusa. */
export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemType: deletionItemType('item_type').notNull(),
    itemId: uuid('item_id').notNull(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    reason: text('reason'),
    requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'set null' }),
    status: deletionStatus('status').notNull().default('pending'),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('deletion_requests_status_idx').on(t.status),
    // Um pedido pendente por item.
    uniqueIndex('deletion_requests_one_pending_idx').on(t.itemType, t.itemId).where(sql`${t.status} = 'pending'`),
  ],
);

export const notificationType = pgEnum('notification_type', [
  'deletion.requested',
  'deletion.approved',
  'deletion.rejected',
  'drive.failed',
  'announcement',
]);
/** Para quem vai o comunicado: todos os ativos, só colaboradores, só leitores ou pessoas escolhidas. */
export const broadcastAudience = pgEnum('broadcast_audience', ['all', 'members', 'viewers', 'people']);

/** Comunicados enviados pela administração. Cada destinatário recebe uma linha em `notifications`. */
export const broadcasts = pgTable(
  'broadcasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'set null' }),
    audience: broadcastAudience('audience').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    link: text('link'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('broadcasts_created_idx').on(t.createdAt)],
);

/** Notificações dentro do ERP. Cada pessoa só lê as próprias. */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationType('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    // Caminho dentro do ERP para o item da notificação, ex.: "/pedidos-de-exclusao".
    link: text('link'),
    // Comunicado: quem enviou e de qual envio esta linha faz parte (para contar quem leu).
    senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'set null' }),
    broadcastId: uuid('broadcast_id').references(() => broadcasts.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_created_idx').on(t.userId, t.createdAt),
    // Aba "Não lidas" e contador do sino.
    index('notifications_user_unread_idx').on(t.userId, t.createdAt).where(sql`${t.readAt} is null`),
    index('notifications_broadcast_idx').on(t.broadcastId),
  ],
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectFile = typeof projectFiles.$inferSelect;
export type ProjectNote = typeof projectNotes.$inferSelect;
export type DeletionRequest = typeof deletionRequests.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationType = (typeof notificationType.enumValues)[number];
export type BroadcastAudience = (typeof broadcastAudience.enumValues)[number];
export type Subfolder = (typeof projectSubfolder.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];
