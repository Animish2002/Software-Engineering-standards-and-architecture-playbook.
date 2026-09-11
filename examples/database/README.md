# Example: schema to query, end to end

Takes one hot query ("this user's files in this folder, newest first,
paginated") from a bad first draft to the indexed, keyset-paginated final
version — showing [03-databases/schema-design.md](../../03-databases/schema-design.md),
[03-databases/indexing.md](../../03-databases/indexing.md), and
[03-databases/pagination.md](../../03-databases/pagination.md) as one
continuous decision rather than three separate topics.

## 1. The naive schema and query

```sql
create table files (id serial primary key, owner varchar(255), folder varchar(255), name text, deleted int default 0);

select * from files where owner = 'user@example.com' and folder = 'reports' and deleted = 0 order by id desc limit 20;
```

Problems, each addressed by a different standard document:

| Problem | Fix | Doc |
| --- | --- | --- |
| `owner`/`folder` as strings, not FKs | UUID FKs to `users`/`folders` | [relationships.md](../../03-databases/relationships.md) |
| `deleted` as an int with no timestamp | `is_trashed boolean` + `trashed_at timestamptz` | [soft-deletes-and-audit-columns.md](../../03-databases/soft-deletes-and-audit-columns.md) |
| `select *` | Explicit columns | [query-optimization.md](../../03-databases/query-optimization.md) |
| No index → sequential scan | Composite index | [indexing.md](../../03-databases/indexing.md) |
| `order by id` isn't a meaningful sort | `order by created_at` | [naming-conventions.md](../../03-databases/naming-conventions.md) |
| No pagination beyond `LIMIT` | Keyset pagination | [pagination.md](../../03-databases/pagination.md) |

## 2. The corrected schema

```sql
create table files (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete restrict,
  parent_id   uuid references folders(id) on delete cascade,
  name        text not null check (length(name) between 1 and 255),
  size_bytes  bigint not null check (size_bytes >= 0),
  is_trashed  boolean not null default false,
  trashed_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_files_owner_parent_created
  on files (owner_id, parent_id, created_at desc, id desc)
  where not is_trashed;
```

Column order in the index: `owner_id` and `parent_id` are always
filtered by equality; `created_at desc, id desc` matches the `ORDER BY`
exactly, including the tiebreaker id needed for stable keyset pagination.
`where not is_trashed` keeps the index small and matches the hot query's
fixed predicate — see the leftmost-prefix explanation in
[indexing.md](../../03-databases/indexing.md#composite-indexes-and-the-leftmost-prefix).

## 3. The final query (Drizzle)

```ts
export function listFilesPage(ownerId: string, parentId: string | null, { limit, cursor }: CursorQuery) {
  return db.select({ id: files.id, name: files.name, sizeBytes: files.sizeBytes, createdAt: files.createdAt })
    .from(files)
    .where(and(
      eq(files.ownerId, ownerId),
      parentId ? eq(files.parentId, parentId) : isNull(files.parentId),
      eq(files.isTrashed, false),
      cursor ? sql`(${files.createdAt}, ${files.id}) < (${cursor.createdAt}, ${cursor.id})` : undefined,
    ))
    .orderBy(desc(files.createdAt), desc(files.id))
    .limit(limit + 1);            // fetch one extra to compute hasMore — see 05-apis/pagination.md
}
```

## 4. Verifying it

```sql
explain (analyze, buffers)
select id, name, size_bytes, created_at from files
where owner_id = $1 and parent_id = $2 and is_trashed = false
order by created_at desc, id desc limit 51;
```

Expected plan: `Limit` → `Index Scan using idx_files_owner_parent_created`,
no `Sort` node, `Buffers: shared hit` low. Full before/after numbers for
this exact transformation are worked in
[03-databases/explain.md](../../03-databases/explain.md#example-before-and-after).

## Related

- [03-databases/schema-design.md](../../03-databases/schema-design.md)
- [04-drizzle-orm/queries.md](../../04-drizzle-orm/queries.md)
- [19-reusable-patterns/database/keyset-pagination.md](../../19-reusable-patterns/database/keyset-pagination.md)
