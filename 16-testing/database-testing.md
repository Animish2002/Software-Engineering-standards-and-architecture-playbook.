# Database testing

## Test database

- Local: same Docker Postgres, separate database (`app_test`), created once (`createdb app_test` or a `db:test:setup` script).
- CI: `services: postgres:17-alpine` with health check; `DATABASE_URL` pointing at it.
- Never the development database (tests truncate tables).

## Migrations in CI

```text
npm run db:migrate    (against the empty test DB)  → proves migrations apply from scratch
npm run db:check      → proves indexes and reference data exist
npm run db:seed:rbac  → reference data for tests
```

Applying from scratch on every CI run is the cheapest guard against a
migration that only worked because of leftover local state.

## What to test at the database level

| Test | How |
| --- | --- |
| Constraints do what the schema says | Insert duplicates → expect unique violation; insert invalid check values → expect error; delete a referenced parent → expect restrict |
| Soft-delete partial unique index | Trash a folder, create another with the same name → succeeds |
| Cascade rules | Delete a user's role → junction rows gone |
| Migration reversibility (if you keep down migrations) | Optional; most teams fix forward |
| Query plans for hot queries (optional, valuable) | `EXPLAIN` in a test asserting no `Seq Scan` on the big tables at seeded volume |

```ts
it('uses the composite index for folder listing', async () => {
  const plan = await db.execute(sql`explain (format json) select id from files where owner_id = ${u.id} and parent_id = ${f.id} and is_trashed = false order by created_at desc limit 50`);
  expect(JSON.stringify(plan.rows)).toContain('idx_files_owner_parent_created');
});
```

## Fixtures and volume

- Factories for unit-sized data.
- A `seed:perf` script generating realistic volume (e.g., 50 users × 5k files) for latency tests and `EXPLAIN` work; not run in the normal suite.

## Isolation strategies

| Strategy | Pros | Cons |
| --- | --- | --- |
| Truncate touched tables per test | Simple; works with code that uses transactions | Slower with many tables |
| Transaction per test, rolled back | Fast | Breaks when the code under test opens transactions or uses `CONCURRENTLY` |
| Schema per worker | Parallel tests | Setup complexity |

Default: truncate, single worker. Parallelise later if the suite gets slow.

## Related

- [integration-testing.md](integration-testing.md)
- [03-databases/migrations.md](../03-databases/migrations.md)
