# Indexing

## What is it?

An index is a separate, sorted data structure (a B-tree by default) that
maps column values to row locations. The database can walk it to find
matching rows without scanning the whole table, and can read rows out of it
already in order.

## Why does it matter?

Without the right index, every filter is a sequential scan over every row
including other users' data, and every sort is an in-memory sort of the
whole result. Tables feel fine at 1,000 rows and fall over at 1,000,000. With
the right index, the same query touches a few pages.

The cost: each index slows every `INSERT`/`UPDATE`/`DELETE` on that table
slightly and takes disk space. Index for the queries you run, not for every
column.

## When should I create an index?

| Situation | Index |
| --- | --- |
| Column in a `WHERE` equality filter on a hot query | Yes |
| Foreign key column (Postgres) | **Always** (joins, cascades, "children of X") |
| Column(s) in `ORDER BY` on a hot query, especially with `LIMIT` | Yes, matching the sort order |
| Columns in `JOIN ... ON` | Yes (usually the FK index covers it) |
| Business uniqueness | Unique index (it's a constraint too) |
| Filter always includes a fixed predicate (`deleted_at is null`) | Partial index with that predicate |
| Range filter (`created_at > ...`) after equality filters | Composite, equality columns first, range column last |

## When should I NOT create an index?

- Small tables (a few thousand rows that fit in memory): the planner will scan anyway.
- Low-selectivity columns alone (`is_active` on a table where 95% are active). Use them as a partial-index predicate instead.
- Columns you never filter or sort on.
- Write-heavy tables where the read doesn't happen (log ingestion).
- Every column "just in case". Each one costs writes and confuses the planner.

## Index types

| Type | Use for | Notes |
| --- | --- | --- |
| **B-tree** (default) | Equality, ranges, sorting, `LIKE 'prefix%'` | 95% of indexes |
| **Composite B-tree** | Multiple columns filtered together | Column order matters (see below) |
| **Unique** | Uniqueness + lookup | Prefer over a plain index on the same columns |
| **Partial** (PG; MySQL lacks it) | Index only rows matching a predicate | Smaller, faster, matches hot queries exactly |
| **Covering / INCLUDE** (PG 11+) | Index-only scans | `include (name, size_bytes)` adds columns without indexing them |
| **Expression** | `lower(email)`, `(data->>'status')` | Query must use the same expression |
| **GIN** (PG) | JSONB containment, arrays, full-text `tsvector` | Slower to update; great for `@>` and `@@` |
| **GiST / SP-GiST** (PG) | Geometry, ranges, exclusion constraints | |
| **BRIN** (PG) | Huge append-only tables ordered by time | Tiny; only for naturally ordered data |
| **Hash** | Equality only | Rarely better than B-tree; skip |
| **FULLTEXT** (MySQL) | Text search | InnoDB full-text |

## Composite indexes and the leftmost prefix

```sql
create index idx_orders_user_status_created on orders (user_id, status, created_at desc);
```

The index is sorted by `user_id`, then `status` within each user, then
`created_at` within each status. It can be used when the query constrains a
**leftmost prefix** of those columns:

| Query | Uses the index? | Why |
| --- | --- | --- |
| `where user_id = $1` | Yes | Prefix (user_id) |
| `where user_id = $1 and status = 'paid'` | Yes | Prefix (user_id, status) |
| `where user_id = $1 and status = 'paid' order by created_at desc` | Yes, and no sort needed | Full prefix + matching order |
| `where user_id = $1 order by created_at desc` | Partially: finds the user's rows, but must sort (status is skipped) | Gap in the prefix |
| `where status = 'paid'` | No (Postgres may still scan the index, inefficiently) | Not a prefix |
| `where created_at > now() - interval '1 day'` | No | Not a prefix |

**Ordering rule:** equality columns first (most selective first among them
if all are always present), then the range or sort column last. One
composite index often replaces several single-column ones; a single-column
index on the first column is redundant once the composite exists.

## Examples

### Foreign key + hot listing

```sql
-- "files in this folder for this owner, not trashed, newest first"
create index idx_files_owner_parent_created
  on files (owner_id, parent_id, created_at desc)
  where deleted_at is null;
```

Serves: listing a folder, counting children, ordering by date, cascades
from `folders`, all without touching trashed rows.

### Unique with soft delete

```sql
create unique index uq_users_email on users (lower(email));                  -- expression + unique
create unique index uq_stars_user_resource on stars (user_id, resource_id);  -- prevents double-star
```

### Covering index

```sql
-- the query reads only these columns → index-only scan, no heap access
create index idx_files_owner_size on files (owner_id) include (size_bytes) where deleted_at is null;
select sum(size_bytes) from files where owner_id = $1 and deleted_at is null;
```

### Range query

```sql
-- "audit rows for this actor in a date range"
create index idx_audit_actor_created on audit_logs (actor_user_id, created_at desc);
```

### What NOT to do

```sql
create index idx_files_is_trashed on files (is_trashed);      -- two values; useless alone
create index idx_files_name on files (name);                  -- never filtered by exact name
create index idx_files_owner on files (owner_id);             -- redundant with idx_files_owner_parent_created
```

## How to know an index is used

`EXPLAIN (ANALYZE, BUFFERS)` shows `Index Scan` / `Index Only Scan` /
`Bitmap Index Scan` instead of `Seq Scan`, and a plausible row estimate.
See [explain.md](explain.md). Check unused indexes periodically:

```sql
-- Postgres: indexes never scanned since stats reset
select schemaname, relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
from pg_stat_user_indexes where idx_scan = 0 order by pg_relation_size(indexrelid) desc;
```

## Production considerations

- Create indexes on live Postgres tables with `CREATE INDEX CONCURRENTLY` (outside a transaction; Drizzle migrations need a custom SQL step for this). MySQL `ALTER TABLE ... ADD INDEX` is online for InnoDB in most cases.
- Verify in production that every index the migrations declare exists (`pg_indexes`); a health endpoint or a `db:check` script that lists missing ones catches a skipped migration.
- Reindex bloated indexes occasionally (`REINDEX CONCURRENTLY`), especially after mass deletes.
- Keep index names explicit so they can be found and dropped.

## Checklist

- [ ] Every FK column indexed (Postgres).
- [ ] Every hot `WHERE`/`ORDER BY` combination has a matching composite index, equality first, sort last.
- [ ] Soft-delete tables use partial indexes on active rows.
- [ ] No single-column index that is a prefix of a composite.
- [ ] No index on a boolean or other two-value column alone.
- [ ] `EXPLAIN ANALYZE` confirms the index is used at realistic volume.
- [ ] Unused indexes reviewed periodically.

## Related

- [explain.md](explain.md)
- [query-optimization.md](query-optimization.md)
- [04-drizzle-orm/indexing.md](../04-drizzle-orm/indexing.md)
- [23-decision-guides/databases.md](../23-decision-guides/databases.md) ("when to add an index")
