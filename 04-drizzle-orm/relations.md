# Drizzle relations

## FK vs `relations()`

- `references()` on a column creates a **database foreign key**. It enforces integrity.
- `relations()` tells **Drizzle's relational query API** (`db.query.x.findMany({ with: ... })`) how tables connect. It creates nothing in the database.

Declare both. The FK for correctness, the relation for ergonomic nested reads.

## Declaring

```ts
// schema/users.ts
export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
  folders: many(folders),
  userRoles: many(userRoles),
}));

// schema/items.ts
export const filesRelations = relations(files, ({ one }) => ({
  owner: one(users, { fields: [files.ownerId], references: [users.id] }),
  parent: one(folders, { fields: [files.parentId], references: [folders.id] }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  owner: one(users, { fields: [folders.ownerId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id], relationName: 'folderTree' }),
  children: many(folders, { relationName: 'folderTree' }),
  files: many(files),
}));

// schema/rbac.ts — many-to-many through a junction
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));
```

- `one()` goes on the side holding the FK, with `fields`/`references`.
- `many()` on the other side, no fields.
- Two relations between the same pair of tables (self-reference, or two FKs to `users`) need `relationName` to disambiguate.

## Using them

```ts
const user = await db.query.users.findFirst({
  where: eq(users.id, id),
  columns: { id: true, email: true, name: true },            // never select passwordHash by accident
  with: {
    userRoles: { with: { role: { with: { rolePermissions: { with: { permission: { columns: { key: true } } } } } } } },
  },
});
const permissionKeys = user?.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)) ?? [];
```

Drizzle issues one query per relational request (it builds a single SQL
statement with lateral joins/JSON aggregation), so `with` does not cause
N+1.

## When to use the relational API vs the select builder

| Use | For |
| --- | --- |
| `db.query.*` (relational) | Reads that return a nested object graph the API returns as-is; simple filters. |
| `db.select()...` (builder) | Aggregates, joins with computed columns, `GROUP BY`, `DISTINCT ON`, anything needing precise SQL shape or performance tuning. |

Don't build a nested graph and then flatten it in JavaScript; use the
builder with a join.

## Polymorphic references

`shares.resourceId` points at files *or* folders. `relations()` can't
express that; resolve it in the repository with a `CASE`/union or two
queries. That's expected. See
[03-databases/relationships.md](../03-databases/relationships.md).

## Related

- [schema.md](schema.md)
- [queries.md](queries.md)
