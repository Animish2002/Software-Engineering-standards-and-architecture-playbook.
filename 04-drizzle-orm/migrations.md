# Drizzle migrations

Database-level rules (expand/contract, locking, backfills) are in
[03-databases/migrations.md](../03-databases/migrations.md). This page is
the Drizzle workflow.

## Commands

| Command | Does | Use |
| --- | --- | --- |
| `drizzle-kit generate --name=x` | Diffs schema TS vs the last snapshot; writes `drizzle/NNNN_x.sql` + `meta/` | Every schema change |
| `drizzle-kit migrate` / `migrate()` in a script | Applies pending SQL files in order; records them in `__drizzle_migrations` | Local, CI, deploy |
| `drizzle-kit push` | Applies the schema diff directly, no files | Prototyping and throwaway local DBs **only** |
| `drizzle-kit check` | Validates migration consistency | CI |
| `drizzle-kit studio` | Browser UI for the database | Local |

**Never `push` to a shared or production database.** It has no history and
can drop columns.

## Workflow

```bash
# 1. edit packages/db/src/schema/*.ts
# 2. generate with a descriptive name
npm run db:generate -- --name=add_shares_permission
# 3. open drizzle/0007_add_shares_permission.sql and READ it
# 4. adjust for production safety if needed (see below)
# 5. apply locally, run the app and tests
npm run db:migrate
# 6. commit schema change + migration + meta together
```

## Editing generated SQL

Drizzle's generator writes plain `CREATE INDEX`, `ALTER TABLE ... ADD
CONSTRAINT`, etc. For live tables, edit the generated file before it's
applied anywhere (it hasn't been recorded yet, so editing is safe):

```sql
-- generated
CREATE INDEX "idx_files_owner_parent_created" ON "files" USING btree ("owner_id","parent_id","created_at" DESC NULLS LAST) WHERE "files"."is_trashed" = false;
-- edited for a large live table
CREATE INDEX CONCURRENTLY "idx_files_owner_parent_created" ON "files" ...;
```

`CONCURRENTLY` can't run inside a transaction; Drizzle wraps each migration
file in one. Options: use the `--> statement-breakpoint` markers and a
custom migration runner that opts out of the transaction for that file, or
apply that index manually with the same name and let a follow-up `db:check`
confirm it exists. Document whichever you pick.

Custom SQL with no schema change (data backfill, trigger, extension):

```bash
npx drizzle-kit generate --custom --name=backfill_actor_names
# writes an empty migration file to fill in
```

## Production flow

1. CI runs `drizzle-kit check` and applies migrations to a fresh database for the test suite.
2. Deploy step (before the new code takes traffic) runs `npm run db:migrate` against the target environment with `DATABASE_URL` from secrets.
3. `npm run db:check` (your read-only script) reports: migrations on disk vs `__drizzle_migrations`, expected indexes present in `pg_indexes`, reference rows seeded.
4. If a migration must be applied by hand (concurrent index), do it before the deploy and verify with `db:check`.

## Seeds

- `seed:rbac` reconciles reference data (permissions, roles, role→permission grants): inserts missing, removes grants no longer in code. Safe to run anywhere, every deploy.
- `seed` (demo users with known passwords) is local-only. Guard it: refuse to run when `NODE_ENV=production`.

## `db:check` script sketch

```ts
const applied = await db.execute(sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at`);
const onDisk = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
const indexes = await db.execute(sql`select indexname from pg_indexes where schemaname = 'public'`);
const missing = EXPECTED_INDEXES.filter((n) => !indexes.rows.some((r) => r.indexname === n));
console.log({ appliedCount: applied.rows.length, onDiskCount: onDisk.length, missingIndexes: missing });
```

Keep `EXPECTED_INDEXES` explicit (the compiled API doesn't ship `.sql`
files) and update it whenever a migration adds an index.

## Common mistakes

- Generating and committing without reading the SQL.
- `push` against a shared database.
- Migrations that depend on data seeded by a script that hasn't run.
- Deleting `meta/` snapshots (the generator loses its baseline).
- Renaming a column in the schema without telling the generator (it produces drop + add; use the interactive rename prompt or hand-write `ALTER TABLE ... RENAME COLUMN`).

## Related

- [03-databases/migrations.md](../03-databases/migrations.md)
- [setup.md](setup.md)
