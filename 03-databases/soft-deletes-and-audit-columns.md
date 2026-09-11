# Soft deletes and audit columns

## Standard columns

Every table:

```sql
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Keep `updated_at` correct with a trigger (Postgres) or `ON UPDATE
CURRENT_TIMESTAMP(6)` (MySQL), or set it in the ORM on every update
(`$onUpdate(() => new Date())` in Drizzle). Pick one; a trigger survives
scripts that bypass the ORM.

```sql
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_files_updated_at before update on files for each row execute function set_updated_at();
```

Who-did-what columns (`created_by`, `updated_by`) when the product needs
attribution on the row itself; otherwise the audit log table covers it
([02-backend/logging.md](../02-backend/logging.md)).

## Soft deletes

### What is it?

Marking a row as deleted (`deleted_at timestamptz` or
`is_trashed boolean + trashed_at`) instead of removing it, so it can be
restored and history stays intact.

### When should I use it?

- The product has a trash/restore feature.
- Rows are referenced by history you must keep (orders, audit).
- Accidental deletion is a real risk and recovery must be self-service.

### When should I NOT use it?

- Junction rows, tokens, sessions, cache-like tables: hard delete.
- When retention law requires actual removal (then you need a purge path regardless).

### Recommended approach

Use a **timestamp**, not just a boolean: `deleted_at` tells you *when*, and
`is null` is the active filter. If you want both for clarity, tie them with a
`CHECK`.

```sql
deleted_at timestamptz,
-- every hot index is partial on the active rows
create index idx_files_owner_parent on files (owner_id, parent_id) where deleted_at is null;
-- uniqueness only among active rows
create unique index uq_folders_name on folders (owner_id, parent_id, name) where deleted_at is null;
```

Apply the filter in **one** place per table in the application: a
repository helper, a Drizzle helper, or a view.

```ts
// repository helper
const active = isNull(files.deletedAt);
export const listChildren = (ownerId, parentId) =>
  db.select().from(files).where(and(eq(files.ownerId, ownerId), eq(files.parentId, parentId), active));
```

### Rules to decide up front

- Do child rows get soft-deleted with the parent? (Usually yes, in the same transaction, or derived: "a file is trashed if any ancestor is".)
- Does restoring a child whose parent is still trashed restore the parent or move the child to root?
- Is there a permanent delete at all? If "no, by policy", say so in the docs and accept unbounded growth (and quota accounting must ignore trashed rows).
- Do trashed rows count against quotas, uniqueness, listings? (Usually no, no, no.)

### Common mistakes

- Forgetting the filter in one query (trashed rows appear in a listing, or count toward quota).
- Non-partial indexes that carry all the trashed rows forever.
- Unique constraints that block re-creating a trashed name.
- `ON DELETE CASCADE` FKs alongside soft delete (they never fire, which is fine, but people assume they clean up).
- Soft-deleting users but leaving their sessions valid. Deactivation must revoke tokens.

## Checklist

- [ ] `created_at`, `updated_at` on every table; `updated_at` maintained automatically.
- [ ] Soft-delete decided per table; timestamp column; partial indexes.
- [ ] Active filter applied in one helper per table.
- [ ] Parent/child trash semantics written down.
- [ ] Permanent-delete policy written down.

## Related

- [constraints.md](constraints.md)
- [indexing.md](indexing.md)
- [02-backend/logging.md](../02-backend/logging.md)
