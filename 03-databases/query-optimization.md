# Query optimization

## Method

1. **Find** the slow query (`pg_stat_statements`, slow log, request timings).
2. **Measure** with `EXPLAIN (ANALYZE, BUFFERS)` at realistic volume ([explain.md](explain.md)).
3. **Fix the biggest node**: usually a missing index, a sort, or a loop.
4. **Re-measure.** Keep the before/after numbers in the PR.
5. Only then consider caching or denormalization.

## The recurring patterns, before and after

### 1. Missing index on a filter or FK

Covered in [indexing.md](indexing.md). Most slow queries are this.

### 2. `SELECT *`

```sql
-- Avoid: drags every column (including large text/JSON) through the network and prevents index-only scans
select * from files where owner_id = $1;
-- Recommended
select id, name, size_bytes, mime_type, created_at from files where owner_id = $1;
```

In Drizzle, use `.select({ ... })` with explicit columns or `columns:` in
relational queries.

### 3. N+1 queries

```ts
// Avoid: 1 query for folders + 1 per folder
const folders = await db.select().from(foldersTable).where(eq(foldersTable.ownerId, uid));
for (const f of folders) f.fileCount = await countFiles(f.id);

// Recommended: one query with a join/aggregate
const rows = await db
  .select({ id: foldersTable.id, name: foldersTable.name, fileCount: count(files.id) })
  .from(foldersTable)
  .leftJoin(files, and(eq(files.parentId, foldersTable.id), isNull(files.deletedAt)))
  .where(eq(foldersTable.ownerId, uid))
  .groupBy(foldersTable.id);
```

Or two queries: fetch parents, then `where parent_id in (...)` for all
children at once, and group in memory. Two round trips beat N.

### 4. `IN` vs `EXISTS` vs `JOIN`

- `IN (subquery)` and `EXISTS` are planned similarly in modern Postgres; `EXISTS` is clearer when you only need "does any match" and stops at the first hit.
- `NOT IN (subquery)` is a trap: if the subquery returns any `NULL`, the result is empty. Use `NOT EXISTS`.
- Use a `JOIN` when you need columns from both sides; `EXISTS` when you don't (avoids duplicate rows and a `DISTINCT`).

```sql
-- users who own at least one file
select u.id from users u where exists (select 1 from files f where f.owner_id = u.id and f.deleted_at is null);
```

### 5. Sorting without an index

A `Sort` node over thousands of rows for a `LIMIT 20` page: add a composite
index whose trailing column matches `ORDER BY` (with direction). Then the
plan becomes `Index Scan` + `Limit` and reads 20 rows.

### 6. Offset pagination deep into a table

`OFFSET 100000 LIMIT 20` reads and discards 100,000 rows every time. Use
keyset pagination ([pagination.md](pagination.md)).

### 7. Functions on indexed columns

```sql
-- Avoid: index on email cannot be used
where lower(email) = $1
-- Recommended: expression index, or citext, or store normalized
create index uq_users_email_lower on users (lower(email));
```

Same for `date(created_at) = $1` (use a range: `created_at >= $1 and created_at < $1 + interval '1 day'`), and for implicit casts (`where id = '123'` on an integer column).

### 8. Leading wildcards

`LIKE '%term%'` cannot use a B-tree. Options: `pg_trgm` GIN index for
substring search, or full-text search ([postgres/full-text-search.md](postgres/full-text-search.md)).

### 9. Recursive walks in application code

```ts
// Avoid: load every folder the user has and walk the tree in JS on every breadcrumb render
// Recommended: recursive CTE with a depth guard, returns only the path
```

See [relationships.md](relationships.md).

### 10. Too many round trips

Each query is a network hop (1-30 ms on a hosted DB). A page that does
five sequential queries pays five hops. Options: combine into one query with
joins/CTEs; run independent queries in parallel (`Promise.all`); return
everything a screen needs from one endpoint.

### 11. Aggregates over big ranges

`count(*)` over a large filtered set is a scan. For "total rows" in
paginated UIs, either accept an estimate, cache the count, maintain a
counter ([denormalization.md](denormalization.md)), or drop the total and
use "has more" (keyset).

### 12. Transactions held open

A transaction that waits on an HTTP call or user input holds locks and a
connection. Keep transactions short and purely database-bound
([transactions.md](transactions.md)).

### 13. Unbounded queries

Every list endpoint has a maximum page size enforced server-side. Every
`IN (...)` list is capped.

## Connection-level

- Use a pool; size it correctly ([connection-pooling.md](connection-pooling.md)).
- Prepared statements for hot queries ([04-drizzle-orm/prepared-statements.md](../04-drizzle-orm/prepared-statements.md)).
- Set `statement_timeout` (Postgres) so a runaway query can't hold a connection forever.

## Checklist

- [ ] Slow query identified from statistics, not guesswork.
- [ ] `EXPLAIN ANALYZE` before and after, at realistic volume.
- [ ] Explicit column lists.
- [ ] No N+1: joins, `IN` batches, or parallel queries.
- [ ] `ORDER BY` + `LIMIT` backed by a matching index.
- [ ] Keyset pagination for deep or infinite lists.
- [ ] No functions on indexed columns in predicates (or expression indexes).
- [ ] Round trips per request counted and minimised.
- [ ] Transactions short; `statement_timeout` set.

## Related

- [explain.md](explain.md), [indexing.md](indexing.md), [pagination.md](pagination.md)
- [04-drizzle-orm/performance.md](../04-drizzle-orm/performance.md)
- [17-performance/database.md](../17-performance/database.md)
