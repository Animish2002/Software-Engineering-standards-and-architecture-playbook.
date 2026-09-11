# Database checklist (per schema change)

## Design

- [ ] Table = one entity; columns describe that entity only (3NF); snapshots documented.
- [ ] PK: UUID v7 (or `bigint identity` for internal append-only).
- [ ] `NOT NULL` everywhere except real optionals; `DEFAULT` for timestamps/flags.
- [ ] `UNIQUE` for business uniqueness (partial on active rows if soft-deleted).
- [ ] FK on every reference with explicit `ON DELETE`; **index on every FK** (Postgres).
- [ ] `CHECK` for ranges, lengths, enums, dependent columns.
- [ ] `created_at`, `updated_at` (trigger or ORM), soft-delete columns if applicable.
- [ ] Names follow `snake_case`, `idx_`/`uq_`/`chk_`/`fk_` conventions.
- [ ] Money as integer minor units or `numeric`; timestamps `timestamptz`; text as `text` (+ CHECK) on Postgres.

## Indexes

- [ ] Hot queries listed; composite indexes with equality columns first, sort column last (direction).
- [ ] Partial indexes where a fixed predicate (`is_trashed = false`) is always present.
- [ ] No redundant single-column prefix indexes; no index on boolean columns alone.
- [ ] `EXPLAIN ANALYZE` confirms index use at realistic volume.
- [ ] Index names added to `EXPECTED_INDEXES` for `db:check`/health.

## Migration

- [ ] Generated with a descriptive name; SQL read and understood.
- [ ] Backwards compatible with the running code (expand/contract).
- [ ] Large live tables: `CREATE INDEX CONCURRENTLY`; constraints `NOT VALID` then `VALIDATE`; backfills batched.
- [ ] `lock_timeout` considered.
- [ ] Not `push`ed to a shared database.
- [ ] Applies cleanly from scratch in CI.

## Queries

- [ ] Explicit columns; owner/tenant scope in every `WHERE`.
- [ ] No N+1; independent queries in `Promise.all`.
- [ ] Keyset pagination for large lists; bounded page sizes.
- [ ] Tree walks as recursive CTEs with depth guard.
- [ ] Transactions short, DB-only; `FOR UPDATE` on read-then-write.

## Operations

- [ ] `db:check` passes on the target environment after deploy.
- [ ] Backups enabled; restore tested at least once.
- [ ] Demo seed guarded against production.

## Related

- [03-databases/README.md](../03-databases/README.md)
