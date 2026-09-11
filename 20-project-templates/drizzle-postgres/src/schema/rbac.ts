import { pgTable, text, uuid, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { id } from './_shared.js';
import { users } from './users.js';

export const roles = pgTable('roles', {
  id: id(),
  name: text('name').notNull().unique(),
});

export const permissions = pgTable('permissions', {
  id: id(),
  key: text('key').notNull().unique(),          // 'file:upload', 'user:manage'
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
  index('idx_role_permissions_permission').on(t.permissionId),
]);

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
  index('idx_user_roles_role').on(t.roleId),
]);

export const rolesRelations = relations(roles, ({ many }) => ({ rolePermissions: many(rolePermissions), userRoles: many(userRoles) }));
export const permissionsRelations = relations(permissions, ({ many }) => ({ rolePermissions: many(rolePermissions) }));
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));
