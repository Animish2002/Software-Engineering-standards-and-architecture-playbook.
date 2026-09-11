# Relationships

## One-to-many (the default)

A file has one owner; an owner has many files. The FK lives on the **many**
side.

```sql
create table files (
  id       uuid primary key,
  owner_id uuid not null references users(id) on delete restrict,
  ...
);
create index idx_files_owner_id on files (owner_id);   -- Postgres does NOT do this for you
```

## One-to-one

Rare. Either merge the columns into one table (usual answer) or split when:

- the optional part is large and rarely read (`user_profiles` with a bio and avatar blob), or
- the parts have different access patterns or permissions.

The FK goes on the dependent side and is `UNIQUE`:

```sql
create table user_settings (
  user_id uuid primary key references users(id) on delete cascade,  -- PK = FK: exactly one per user
  theme   text not null default 'system'
);
```

## Many-to-many: junction tables

A user has many roles; a role has many users.

```sql
create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  primary key (user_id, role_id)          -- also the index for lookups by user
);
create index idx_user_roles_role_id on user_roles (role_id);   -- lookups by role
```

- Composite PK on the pair prevents duplicates and indexes the first column.
- Add the reverse index for the second column.
- When the relationship has attributes (`granted_at`, `granted_by`), it is an entity: give it its own `id` and treat it as a table in its own right.

## Self-referencing (trees)

Folders inside folders.

```sql
parent_id uuid references folders(id) on delete cascade   -- null = root
```

Walk the tree in SQL with a recursive CTE, bounded by depth, never by
loading everything into the application:

```sql
with recursive crumbs as (
  select id, parent_id, name, 1 as depth from folders where id = $1
  union all
  select f.id, f.parent_id, f.name, c.depth + 1
  from folders f join crumbs c on f.id = c.parent_id
  where c.depth < 64                                      -- cycle/depth guard
)
select * from crumbs order by depth desc;
```

Prevent cycles in the application (a folder cannot be moved into its own
descendant) *and* keep the depth guard as a backstop.

## Polymorphic references

A share points at a file **or** a folder. Options:

| Option | Shape | Tradeoff |
| --- | --- | --- |
| **Type + id columns, no FK** | `resource_type text, resource_id uuid` | Simple; no referential integrity; orphan rows possible if targets are hard-deleted. Acceptable when targets are only soft-deleted. |
| Two nullable FKs + CHECK | `file_id uuid references files, folder_id uuid references folders, check (num_nonnulls(file_id, folder_id) = 1)` | Full integrity; one column per target type; queries must `coalesce`. Best when there are 2-3 target types. |
| Shared parent table ("items") | `items(id, kind)`; `files.id references items(id)` | Full integrity, uniform id space; an extra insert per row. Best when many tables share behaviour (stars, shares, comments). |

Choose the two-FK form by default when integrity matters; use type+id when
targets are never hard-deleted and document that.

## `ON DELETE` rules

| Rule | Use when |
| --- | --- |
| `restrict` (default in spirit) | Deleting the parent should be impossible while children exist (owner of files). |
| `cascade` | Children are meaningless without the parent (junction rows, tokens, settings). |
| `set null` | The child should survive and just lose the reference (audit log actor). |

Never leave it implicit; write the rule you mean.

## Common mistakes

- Missing FK index on Postgres (every join and every cascade becomes a sequential scan).
- Junction tables with a surrogate `id` and no unique constraint on the pair (duplicates).
- Encoding hierarchy in a path string (`'/a/b/c'`) and parsing it in code.
- Cascading deletes on tables that are meant to be soft-deleted.

## Related

- [constraints.md](constraints.md)
- [indexing.md](indexing.md)
- [04-drizzle-orm/relations.md](../04-drizzle-orm/relations.md)
