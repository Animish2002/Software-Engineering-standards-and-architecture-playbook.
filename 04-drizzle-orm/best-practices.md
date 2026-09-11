# Drizzle best practices (consolidated)

## Schema

- One file per domain; `index.ts` re-exports; relations beside tables.
- Shared `id()`, `timestamps`, `softDelete` helpers.
- Every FK: `references()` + `index()` (Postgres).
- Named indexes and checks; partial indexes on active rows.
- `timestamp` with `withTimezone: true`; `bigint` with `mode: 'number'` unless values exceed 2^53.
- `$inferSelect`/`$inferInsert` types exported; no hand-written row types.

## Migrations

- `generate --name=...`; read the SQL; commit schema + migration + meta together.
- Never `push` to shared databases.
- Apply as a deploy step; verify with a read-only `db:check`.
- Reference-data seed reconciles and is production-safe; demo seed refuses to run in production.

## Queries

- Explicit columns on hot reads.
- Relational API for nested reads; builder for aggregates and precise SQL.
- Optional filters via `and(...conditions)` with `undefined` entries.
- Keyset pagination with a unique tiebreaker.
- `sql` for CTEs/full-text; map raw rows at the repository boundary.
- Scoped writes with `.returning()` to detect not-found.

## Transactions

- Service opens; repositories accept `DbOrTx`.
- No I/O inside; short; retry `40001`/`40P01` when using serializable.

## Structure

- Repository = module of named functions per table; no generic base class; no interfaces with one implementation.
- Sensitive columns excluded by default (`publicColumns`).
- Test repositories against a real database.

## Performance

- Query logging behind an env flag.
- `EXPLAIN ANALYZE` the top endpoints at realistic volume.
- `Promise.all` for independent queries; `inArray` for batches; no loops of queries.
- Prepared statements only for measured hot paths with fixed shape.

## Don't

- `select()` without columns in list endpoints.
- Filter soft-deleted rows in some queries and forget in others; centralise `active`.
- Put `sql` fragments in controllers.
- Rely on `$onUpdate` alone when scripts bypass the ORM (add a trigger).
- Trust that a migration ran; check.

## Related

- Every page in this section, plus [03-databases/README.md](../03-databases/README.md)
