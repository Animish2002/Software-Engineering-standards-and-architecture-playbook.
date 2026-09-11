# Indexes in Drizzle

What to index is in [03-databases/indexing.md](../03-databases/indexing.md).
This page is the syntax.

```ts
import { index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const files = pgTable('files', { /* columns */ }, (t) => [
  // composite, with sort direction on the trailing column
  index('idx_files_owner_parent_created').on(t.ownerId, t.parentId, t.createdAt.desc()),

  // partial (Postgres only)
  index('idx_files_owner_trashed').on(t.ownerId).where(sql`${t.isTrashed} = true`),

  // unique
  uniqueIndex('uq_files_storage_key').on(t.storageKey),

  // expression
  uniqueIndex('uq_users_email_lower').on(sql`lower(${t.email})`),

  // covering (INCLUDE) — via raw SQL migration if the builder version lacks it
  // GIN for jsonb / arrays / trigram
  index('idx_events_payload').using('gin', t.payload),
  index('idx_files_name_trgm').using('gin', sql`${t.name} gin_trgm_ops`),

  // FK index (Postgres does not create it)
  index('idx_files_parent').on(t.parentId),
]);
```

MySQL: `index()`/`uniqueIndex()` from `drizzle-orm/mysql-core`; no
`.where()` (no partial indexes); `fulltext` via raw SQL.

## Checklist when adding an index in Drizzle

- [ ] Name follows `idx_<table>_<cols>` / `uq_<table>_<cols>`.
- [ ] Column order: equality columns first, sort column last with direction.
- [ ] Partial predicate matches the hot query's fixed filter.
- [ ] Migration generated and read; `CONCURRENTLY` added for large live tables.
- [ ] Index name added to the `EXPECTED_INDEXES` list used by `db:check`/health.
- [ ] `EXPLAIN ANALYZE` confirms usage.

## Related

- [schema.md](schema.md)
- [migrations.md](migrations.md)
