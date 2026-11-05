import { sql } from 'drizzle-orm';
import { bigint, boolean, check, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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

/** Cada mudança de etapa de um projeto: arrasto no Kanban, "Mover para" ou remoção da etapa de origem. */
export const projectStageHistory = pgTable(
  'project_stage_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    fromStageId: uuid('from_stage_id')
      .notNull()
      .references(() => stages.id),
    toStageId: uuid('to_stage_id')
      .notNull()
      .references(() => stages.id),
    // Quem moveu. Fica nulo se essa conta for removida; o histórico continua.
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('project_stage_history_project_at_idx').on(t.projectId, t.at)],
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

/** Tipo do evento na Agenda. Sem tipo (nulo) é o evento que veio do Google sem essa marca. */
export const eventKind = pgEnum('event_kind', ['site_visit', 'client_meeting', 'delivery', 'internal_deadline', 'personal']);
/** Onde o evento nasceu. */
export const eventSource = pgEnum('event_source', ['erp', 'google']);
/** synced: igual ao Google; pending: mudança do ERP ainda não enviada; error: o Google recusou e reenviar não resolve. */
export const eventSyncStatus = pgEnum('event_sync_status', ['synced', 'pending', 'error']);

/**
 * Eventos da Agenda, espelho do calendário "De.Croqui ERP" no Google (seção 8). Exclusão lógica:
 * removido no ERP ou cancelado no Google, o evento fica com `deleted_at`.
 */
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    // Fim exclusivo. No dia inteiro, meia-noite (São Paulo) do dia seguinte ao último.
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    allDay: boolean('all_day').notNull().default(false),
    location: text('location'),
    description: text('description'),
    kind: eventKind('kind'),
    projectId: uuid('project_id').references(() => projects.id),
    source: eventSource('source').notNull(),
    googleEventId: text('google_event_id').unique(),
    googleEtag: text('google_etag'),
    // Calendário onde o evento está no Google. Ao conectar outro calendário, o evento é criado de novo nele.
    googleCalendarId: text('google_calendar_id'),
    // Série do Google: cada ocorrência aparece, mas o ERP não edita a série nesta fase.
    recurringEventId: text('recurring_event_id'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    // Horário da última alteração, no ERP (quando a pessoa salvou) ou no Google (`updated`). Decide os conflitos.
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    syncStatus: eventSyncStatus('sync_status').notNull().default('pending'),
    syncError: text('sync_error'),
    syncAttempts: integer('sync_attempts').notNull().default(0),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('events_range_idx').on(t.startsAt, t.endsAt),
    // Fila de envio ao Google.
    index('events_unsynced_idx').on(t.updatedAt).where(sql`${t.syncStatus} <> 'synced'`),
  ],
);

/** connected: sincronizando; reconnect: o token do Google venceu e o administrador precisa entrar de novo. */
export const calendarStatus = pgEnum('calendar_status', ['connected', 'reconnect']);

/**
 * Conexão com o calendário "De.Croqui ERP" na conta do administrador. Uma linha só; desconectar apaga a
 * linha (para a sincronização e esquece o calendário, sem revogar o acesso no Google).
 */
export const calendarSyncState = pgTable('calendar_sync_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Quem conectou (o administrador, dono do token). Fica nulo se essa conta for removida.
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  calendarId: text('calendar_id').notNull(),
  status: calendarStatus('status').notNull().default('connected'),
  syncToken: text('sync_token'),
  // Começo da última consulta ao Google: no máximo uma a cada 2 minutos, para todos.
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** draft: em edição; sent: enviado ao cliente. Só draft é usado na Fase 6a. */
export const budgetStatus = pgEnum('budget_status', ['draft', 'sent']);

/**
 * Orçamentos (Fase 6a). O conteúdo do editor (campos e ambientes) fica em `data`, em JSON. Projeto
 * opcional: sem projeto é o orçamento avulso, que poderá ser vinculado depois. `total_cents` guarda o
 * maior total do documento, em centavos, para listas e buscas.
 */
export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id),
    name: text('name').notNull(),
    // Número sequencial do orçamento no ERP, exibido como "Orçamento nº".
    number: integer('number').notNull().generatedAlwaysAsIdentity(),
    status: budgetStatus('status').notNull().default('draft'),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    totalCents: bigint('total_cents', { mode: 'number' }).notNull().default(0),
    // Quem criou. Fica nulo se essa conta for removida; o orçamento continua.
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    // PDF mais recente salvo no Drive. Vale para avulsos (pasta Avulsos) e de projeto (que também
    // aparecem nos arquivos do projeto). Cada exportação cria um arquivo novo; pdf_version conta as
    // exportações e entra no nome a partir da segunda (-v2, -v3). Não muda updated_at.
    pdfDriveFileId: text('pdf_drive_file_id'),
    pdfName: text('pdf_name'),
    pdfVersion: integer('pdf_version').notNull().default(0),
    pdfExportedAt: timestamp('pdf_exported_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('budgets_number_idx').on(t.number),
    index('budgets_project_updated_idx').on(t.projectId, t.updatedAt),
    // Nome obrigatório também no banco: vazio ou só espaços é recusado.
    check('budgets_name_not_blank', sql`length(btrim(${t.name})) > 0`),
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
export type Event = typeof events.$inferSelect;
export type EventKind = (typeof eventKind.enumValues)[number];
export type CalendarSyncState = typeof calendarSyncState.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type BudgetStatus = (typeof budgetStatus.enumValues)[number];
