# Schema design

## What is it?

Turning the domain into tables, columns, keys, and constraints so that
invalid states are impossible to store and common queries are cheap.

## Why does it matter?

The schema outlives every framework choice. A bad schema is the one thing
you cannot refactor in an afternoon: every query, every migration, and every
report depends on it.

## Recommended approach

### 1. Start from nouns and rules, not screens

List the entities (user, folder, file, share), their identifying attributes,
their relationships (a file has one owner; a folder has zero or one parent),
and the invariants (email is unique; a file's size is non-negative; a user
cannot share what they do not own).

### 2. One table per entity; one row per instance

Each row is one thing. Columns describe that thing only. If a column
describes something else (the owner's email on the file row), it belongs on
that other table. See [normalization.md](normalization.md).

### 3. Encode invariants as constraints

Anything the database *can* enforce, it should. Application checks are
bypassed by the next script, the next endpoint, the next bug. See
[constraints.md](constraints.md).

### 4. Decide the primary key strategy once

UUID (v4 or v7) for anything exposed in URLs or created from multiple
writers; `bigint identity` for internal, high-volume, append-only tables.
See [primary-keys.md](primary-keys.md).

### 5. Add the standard columns

`id`, `created_at`, `updated_at`, and where applicable `deleted_at` /
`trashed_at`. See [soft-deletes-and-audit-columns.md](soft-deletes-and-audit-columns.md).

### 6. Index for the queries you will run

Foreign keys, filter columns, sort columns, uniqueness. See [indexing.md](indexing.md).

## Reference schema (Postgres)

A file-storage product: users with roles, folders, files, shares. Every rule
below is one you will reuse.

```sql
create table users (
  id                  uuid primary key default gen_random_uuid(),
  email               citext not null unique,               -- case-insensitive uniqueness
  name                text not null,
  password_hash       text not null,
  storage_quota_bytes bigint not null default 10737418240 check (storage_quota_bytes >= 0),
  is_trashed          boolean not null default false,
  trashed_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check ((is_trashed and trashed_at is not null) or (not is_trashed and trashed_at is null))
);

create table roles (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table permissions (
  id  uuid primary key default gen_random_uuid(),
  key text not null unique                                   -- 'file:upload'
);

create table role_permissions (
  role_id       uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  primary key (user_id, role_id)
);

create table folders (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references users(id) on delete restrict,
  parent_id  uuid references folders(id) on delete cascade,  -- null = root
  name       text not null check (length(name) between 1 and 255),
  is_trashed boolean not null default false,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_folders_owner_parent on folders (owner_id, parent_id) where not is_trashed;
create index idx_folders_parent on folders (parent_id);
create unique index uq_folders_owner_parent_name on folders (owner_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name) where not is_trashed;

create table files (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete restrict,
  parent_id   uuid references folders(id) on delete cascade,
  name        text not null check (length(name) between 1 and 255),
  mime_type   text not null,
  size_bytes  bigint not null check (size_bytes >= 0),
  storage_key text not null unique,
  is_trashed  boolean not null default false,
  trashed_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_files_owner_parent on files (owner_id, parent_id) where not is_trashed;
create index idx_files_parent on files (parent_id);
create index idx_files_owner_trashed on files (owner_id) where is_trashed;   -- trash view

create type share_type as enum ('link', 'user');
create type share_permission as enum ('view', 'edit');

create table shares (
  id                  uuid primary key default gen_random_uuid(),
  resource_type       text not null check (resource_type in ('file', 'folder')),
  resource_id         uuid not null,                          -- polymorphic: no FK (see relationships.md)
  share_type          share_type not null,
  permission          share_permission not null default 'view',
  token               text not null unique,
  shared_with_user_id uuid references users(id) on delete cascade,
  created_by          uuid not null references users(id) on delete cascade,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now(),
  check (share_type <> 'user' or shared_with_user_id is not null)
);
create index idx_shares_resource on shares (resource_id) where revoked_at is null;
create index idx_shares_recipient on shares (shared_with_user_id) where revoked_at is null;
```

### Design notes on the reference

- `citext` for email: uniqueness is case-insensitive without `lower()` everywhere. (MySQL: use a case-insensitive collation.)
- `on delete restrict` on `owner_id`: you cannot delete a user who still owns data; soft-delete them instead.
- `on delete cascade` on `parent_id`: only meaningful if hard deletes exist; harmless otherwise.
- Partial indexes (`where not is_trashed`) keep the hot index small and match the hot queries exactly.
- Uniqueness of folder names per parent uses `coalesce` because `NULL` is never equal to `NULL` in a unique index.
- A `CHECK` ties `is_trashed` and `trashed_at` together so they cannot disagree.

## Bad example

```sql
create table files (
  id int,                       -- no PK, no identity
  owner varchar(255),           -- email string instead of user id
  path text,                    -- encodes the hierarchy in a string
  size varchar(50),             -- number stored as text
  deleted int default 0,        -- boolean as int, no timestamp
  meta text                     -- JSON blob with things that should be columns
);
```

## Common mistakes

- Designing tables from UI forms (one table per screen).
- Storing lists in a column (`tags: 'a,b,c'`). Use a child table or, in Postgres, an array/JSONB with a GIN index when the list is never joined.
- `varchar(255)` by habit. Use `text` with a `CHECK` on length in Postgres; size `varchar` deliberately in MySQL.
- Nullable columns that are "always set". Make them `NOT NULL`.
- Skipping `updated_at`.
- Composite natural keys as PKs on tables that will be referenced (use a surrogate key and a unique constraint instead).

## Production considerations

- Plan the *hot queries* before finalising indexes; write them down in the migration's comment.
- Large text/binary belongs in object storage with a key in the row, not in the database.
- Enums: Postgres `enum` types are strict and fast but adding a value is a migration; a `text` column with a `CHECK` is easier to evolve. Either is fine; be consistent.

## Checklist

- [ ] Entities, relationships, invariants written down first.
- [ ] Every table: PK, `created_at`, `updated_at`.
- [ ] Every FK: constraint with an explicit `on delete` rule, and an index.
- [ ] Every business uniqueness rule: `UNIQUE`.
- [ ] Every numeric/date value in a numeric/date column.
- [ ] Hot queries listed; indexes match them.

## Related

- [relationships.md](relationships.md), [constraints.md](constraints.md), [indexing.md](indexing.md)
- [04-drizzle-orm/schema.md](../04-drizzle-orm/schema.md) (the same schema in Drizzle)
- [examples/database/](../examples/database/README.md)
