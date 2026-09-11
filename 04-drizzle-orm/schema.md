# Drizzle schema

## Organisation

- One file per domain area (`users.ts`, `rbac.ts`, `items.ts`, `shares.ts`), not one per table and not one giant file.
- `schema/index.ts` re-exports everything; the client and drizzle-kit point at it.
- Relations (`relations()`) live next to the tables they describe.
- Shared column helpers (`timestamps`, `id`) in `schema/_shared.ts`.

## Shared column helpers

```ts
// schema/_shared.ts
import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const id = () => uuid('id').primaryKey().defaultRandom();          // gen_random_uuid()
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};
export const softDelete = {
  isTrashed: boolean('is_trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at', { withTimezone: true }),
};
```

`$onUpdate` runs in the ORM, so scripts using raw SQL bypass it; add a
database trigger if that matters.

## Tables (the reference schema from 03-databases in Drizzle)

```ts
// schema/users.ts
import { pgTable, text, bigint, boolean, timestamp, uuid, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { id, timestamps, softDelete } from './_shared';

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull(),                          // citext: use customType or lower() unique index
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  storageQuotaBytes: bigint('storage_quota_bytes', { mode: 'number' }).notNull().default(10 * 1024 ** 3),
  ...softDelete,
  ...timestamps,
}, (t) => [
  uniqueIndex('uq_users_email_lower').on(sql`lower(${t.email})`),
  check('chk_users_quota_nonnegative', sql`${t.storageQuotaBytes} >= 0`),
]);
```

```ts
// schema/items.ts
export const folders = pgTable('folders', {
  id: id(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  parentId: uuid('parent_id').references((): AnyPgColumn => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  ...softDelete,
  ...timestamps,
}, (t) => [
  index('idx_folders_owner_parent').on(t.ownerId, t.parentId).where(sql`${t.isTrashed} = false`),
  index('idx_folders_parent').on(t.parentId),
  check('chk_folders_name_length', sql`length(${t.name}) between 1 and 255`),
]);

export const files = pgTable('files', {
  id: id(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  parentId: uuid('parent_id').references(() => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storageKey: text('storage_key').notNull().unique(),
  ...softDelete,
  ...timestamps,
}, (t) => [
  index('idx_files_owner_parent_created').on(t.ownerId, t.parentId, t.createdAt.desc()).where(sql`${t.isTrashed} = false`),
  index('idx_files_parent').on(t.parentId),
  check('chk_files_size_nonnegative', sql`${t.sizeBytes} >= 0`),
]);
```

```ts
// schema/shares.ts
export const shareType = pgEnum('share_type', ['link', 'user']);
export const sharePermission = pgEnum('share_permission', ['view', 'edit']);

export const shares = pgTable('shares', {
  id: id(),
  resourceType: text('resource_type', { enum: ['file', 'folder'] }).notNull(),   // CHECK-like at the type level; add a real check too
  resourceId: uuid('resource_id').notNull(),                                     // polymorphic, no FK by design
  shareType: shareType('share_type').notNull(),
  permission: sharePermission('permission').notNull().default('view'),
  token: text('token').notNull().unique(),
  sharedWithUserId: uuid('shared_with_user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamps.createdAt,
}, (t) => [
  index('idx_shares_resource').on(t.resourceId).where(sql`${t.revokedAt} is null`),
  index('idx_shares_recipient').on(t.sharedWithUserId).where(sql`${t.revokedAt} is null`),
  check('chk_shares_resource_type', sql`${t.resourceType} in ('file', 'folder')`),
]);
```

```ts
// schema/rbac.ts — junction tables with composite PKs
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
  index('idx_user_roles_role').on(t.roleId),
]);
```

## Types from the schema

```ts
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

Export these from `packages/db` (or map to `packages/shared-types` when
the API shape differs from the row, e.g., without `passwordHash`).

## Custom types

```ts
// citext
export const citext = customType<{ data: string }>({ dataType: () => 'citext' });
email: citext('email').notNull().unique(),
```

## Rules

- Column names in `snake_case` strings; property names in `camelCase`.
- Every FK has `references()` **and** an `index()` (Postgres).
- `bigint` with `mode: 'number'` for byte counts (safe below 2^53); `mode: 'bigint'` if values can exceed that.
- `timestamp(..., { withTimezone: true })` always.
- Name every index and constraint.
- Keep raw `sql` for partial-index predicates and checks; there is no builder for them and that is fine.

## Related

- [03-databases/schema-design.md](../03-databases/schema-design.md)
- [relations.md](relations.md)
- [indexing.md](indexing.md)
