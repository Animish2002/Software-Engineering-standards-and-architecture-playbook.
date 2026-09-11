# Migrations

## What is it?

Versioned, ordered, committed files that transform the schema from one state
to the next. The database's shape is code, reviewed like code.

## Rules

1. **Every schema change is a migration file.** No manual `ALTER` in production, ever.
2. **Migrations are immutable once merged.** Fix forward with a new one.
3. **Generated from the schema definition** (Drizzle: edit `schema/*.ts`, run `drizzle-kit generate --name=...`), then **read the SQL** before committing. Generators don't know about live data or lock behaviour.
4. **Applied as a deploy step**, before the new code serves traffic, or at process start under a lock on single-instance platforms.
5. **Backwards compatible with the currently running code** during the deploy window (expand/contract, below).
6. **Data migrations are separate** from schema migrations and idempotent.
7. **Never run the demo seed against production.** Keep a separate, production-safe seed for reference data (roles, permissions) that reconciles rather than inserts blindly.

## Expand / contract for zero-downtime changes

Old code and new code run at the same time during a rolling deploy.

| Change | Expand (deploy 1) | Switch code | Contract (deploy 2) |
| --- | --- | --- | --- |
| Rename column | Add new column; backfill; write both | Read new, write both → read/write new | Drop old |
| Change type | Add new column of the new type; backfill | Switch | Drop old |
| Add `NOT NULL` | Add column nullable with default; backfill | Code always writes it | `SET NOT NULL` (PG: add `CHECK ... NOT VALID`, `VALIDATE`, then `SET NOT NULL`) |
| Drop column | Stop reading/writing it in code | | Drop |
| Add table/column/index | Just do it (nullable or with default) | | |

## Locking hazards (Postgres)

| Operation | Lock | Safe way |
| --- | --- | --- |
| `CREATE INDEX` | Blocks writes | `CREATE INDEX CONCURRENTLY` (not inside a transaction) |
| `ADD COLUMN ... DEFAULT x` | Fast since PG 11 (metadata only) for constant defaults | OK |
| `ADD COLUMN ... NOT NULL` without default on a non-empty table | Fails | Add nullable, backfill, then constrain |
| `ALTER COLUMN TYPE` | Rewrites the table | Expand/contract |
| `ADD CONSTRAINT ... FOREIGN KEY` / `CHECK` | Scans the table under lock | `NOT VALID`, then `VALIDATE CONSTRAINT` |
| `SET NOT NULL` | Full scan under lock | Add `CHECK (col IS NOT NULL) NOT VALID`, validate, then `SET NOT NULL` (PG 12+ uses the check) |
| Large `UPDATE` backfill | Long transaction, bloat | Batch by id range, commit per batch |

Set `lock_timeout` (e.g., `2s`) at the top of a migration so it fails fast
instead of queueing behind a long query and blocking everyone.

## Drizzle workflow

```bash
# edit packages/db/src/schema/*.ts
npm run db:generate -- --name=add_share_permission     # writes drizzle/NNNN_add_share_permission.sql + meta
# review the SQL; add CONCURRENTLY / NOT VALID / batching by hand if needed (custom SQL migration)
npm run db:migrate                                     # local
# CI/CD: run db:migrate against the target environment before starting the new build
npm run db:check                                       # read-only: applied vs on disk, indexes present
```

See [04-drizzle-orm/migrations.md](../04-drizzle-orm/migrations.md).

## Verification

A read-only `db:check` script (or health endpoint) that reports: migrations
on disk vs applied, expected indexes present, reference rows seeded. Run it
after every deploy. A pending index-only migration behaves normally, just
slowly, and nothing else would tell you.

## Common mistakes

- `drizzle-kit push` in production (no history, can drop columns).
- Editing an applied migration.
- Generating a migration and not reading it.
- Backfilling millions of rows in one transaction.
- Deploying code that requires a column before the migration ran.
- Rollback scripts that were never tested. Prefer fix-forward; keep backups.

## Checklist

- [ ] Migration generated, reviewed, committed with the schema change.
- [ ] Compatible with the currently deployed code.
- [ ] Indexes created concurrently on live tables.
- [ ] Constraints added `NOT VALID` then validated.
- [ ] Backfills batched.
- [ ] `lock_timeout` set.
- [ ] `db:check` passes after deploy.

## Related

- [04-drizzle-orm/migrations.md](../04-drizzle-orm/migrations.md)
- [18-devops/ci-cd.md](../18-devops/ci-cd.md)
