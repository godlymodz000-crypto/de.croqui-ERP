import { date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
