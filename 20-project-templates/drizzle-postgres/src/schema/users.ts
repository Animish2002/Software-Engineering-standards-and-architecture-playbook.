import { pgTable, text, bigint, timestamp, uuid, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { id, timestamps, softDelete } from './_shared.js';
import { userRoles } from './rbac.js';

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  storageQuotaBytes: bigint('storage_quota_bytes', { mode: 'number' }).notNull().default(10 * 1024 ** 3),
  ...softDelete,
  ...timestamps,
}, (t) => [
  uniqueIndex('uq_users_email_lower').on(sql`lower(${t.email})`),
  check('chk_users_quota_nonnegative', sql`${t.storageQuotaBytes} >= 0`),
  check('chk_users_trashed_consistency', sql`(${t.isTrashed} and ${t.trashedAt} is not null) or (not ${t.isTrashed} and ${t.trashedAt} is null)`),
]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamps.createdAt,
}, (t) => [
  uniqueIndex('uq_refresh_tokens_hash').on(t.tokenHash),
  index('idx_refresh_tokens_user').on(t.userId),
  index('idx_refresh_tokens_expires').on(t.expiresAt),
]);

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
