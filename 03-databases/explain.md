# Reading EXPLAIN and EXPLAIN ANALYZE

## What is it?

`EXPLAIN` shows the plan the query planner *chose*: which scans, joins, and
sorts, in what order, with estimated costs and row counts. `EXPLAIN ANALYZE`
runs the query and adds actual times and row counts. The gap between
estimated and actual rows is where most surprises live.

```sql
-- Postgres: always use these options for a real investigation
explain (analyze, buffers, format text)
select ... ;

-- MySQL 8
explain analyze select ... ;
explain format=json select ... ;
```

`EXPLAIN ANALYZE` executes writes too. Wrap in a transaction and roll back
for `UPDATE`/`DELETE`.

## Plan nodes you will see

| Node | Meaning | Good or bad? |
| --- | --- | --- |
| **Seq Scan** | Reads every row of the table | Fine for tiny tables or when most rows match; bad on a big table with a selective filter |
| **Index Scan** | Walks the index, fetches matching rows from the table | Good for selective filters and ordered reads |
| **Index Only Scan** | Answers from the index alone (covering) | Best; needs the visibility map to be current (`VACUUM`) |
| **Bitmap Index Scan + Bitmap Heap Scan** | Collects matching row locations from one or more indexes, then fetches in physical order | Good for medium selectivity or combining indexes |
| **Nested Loop** | For each outer row, look up inner rows | Great when the outer set is small and the inner has an index; terrible otherwise |
| **Hash Join** | Builds a hash of the smaller side, probes with the larger | Good for large unsorted joins; needs memory (`work_mem`) |
| **Merge Join** | Both sides sorted, merged | Good when both sides are already ordered (by index) |
| **Sort** | In-memory or on-disk sort | Avoid on large sets: add an index matching `ORDER BY` |
| **Incremental Sort** | Sorts within groups already ordered by a prefix | Sign that a composite index almost matches |
| **Aggregate / HashAggregate / GroupAggregate** | `GROUP BY`, `count`, `sum` | Hash needs memory; Group needs sorted input |
| **Limit** | Stops after N rows | Powerful with an index scan: reads only N rows |
| **CTE Scan / Recursive Union** | Common table expressions | Recursive walks; check the depth guard |
| **Materialize** | Caches a subresult | Usually fine |
| **Gather / Parallel Seq Scan** | Parallel workers | Postgres decided the table is big; consider an index instead |

## Reading a plan

1. **Start from the innermost node** (most indented); that runs first.
2. Compare **`rows=` estimated vs actual** on each node. A 10× gap means stale statistics (`ANALYZE table`) or a correlation the planner can't see (consider extended statistics).
3. Find where **actual time** is spent. The node with the biggest `actual time` that isn't just summing its children is the problem.
4. Look at **`loops=`**: a Nested Loop inner node with `loops=50000` is 50,000 index lookups; that is the N+1 pattern in SQL form.
5. With `BUFFERS`: `shared read` = disk; `shared hit` = cache. Many reads on a "fast" query means it's fast only because it's cached.
6. `Rows Removed by Filter` on an Index Scan means the index found rows the query then discarded: the index doesn't match the predicate well enough.

## Example: before and after

Query: files in a folder for a user, newest first, page of 50.

```sql
explain (analyze, buffers)
select id, name, size_bytes, created_at from files
where owner_id = $1 and parent_id = $2 and deleted_at is null
order by created_at desc limit 50;
```

**Before** (no suitable index):

```text
Limit  (cost=41234.11..41234.23 rows=50) (actual time=312.4..312.5 rows=50 loops=1)
  ->  Sort  (cost=41234.11..41301.90 rows=27116) (actual time=312.4..312.4 rows=50 loops=1)
        Sort Key: created_at DESC
        Sort Method: top-N heapsort  Memory: 32kB
        ->  Seq Scan on files  (cost=0.00..40329.00 rows=27116) (actual time=0.02..298.7 rows=27080 loops=1)
              Filter: ((deleted_at IS NULL) AND (owner_id = $1) AND (parent_id = $2))
              Rows Removed by Filter: 1272920
              Buffers: shared hit=2211 read=21100
Execution Time: 312.6 ms
```

Read 1.3 M rows to keep 27 k, then sorted them.

**After** `create index idx_files_owner_parent_created on files (owner_id, parent_id, created_at desc) where deleted_at is null;`:

```text
Limit  (cost=0.56..12.31 rows=50) (actual time=0.03..0.09 rows=50 loops=1)
  ->  Index Scan using idx_files_owner_parent_created on files  (cost=0.56..6371.02 rows=27116) (actual time=0.03..0.08 rows=50 loops=1)
        Index Cond: ((owner_id = $1) AND (parent_id = $2))
        Buffers: shared hit=5
Execution Time: 0.12 ms
```

Read 50 rows in order, no sort. 312 ms → 0.12 ms.

## Finding slow queries in the first place

- **Postgres**: enable `pg_stat_statements`; query it ordered by `total_exec_time` or `mean_exec_time`. Set `log_min_duration_statement = 200` (ms) to log slow ones.
- **MySQL**: `slow_query_log = ON`, `long_query_time = 0.2`; `performance_schema` `events_statements_summary_by_digest`.
- **Application**: log query duration from the pool or ORM (`drizzle` logger) with the request id.

```sql
-- Postgres: top offenders
select calls, round(mean_exec_time::numeric, 1) as mean_ms, round(total_exec_time::numeric) as total_ms, left(query, 100)
from pg_stat_statements order by total_exec_time desc limit 20;
```

## Common mistakes

- Testing on a 100-row dev database and concluding the plan is fine. Seed realistic volume for `EXPLAIN` work.
- Reading only the top cost number; the shape matters more.
- Forgetting `ANALYZE` after bulk loads, so estimates are wrong.
- Fixing symptoms with `SET enable_seqscan = off`. Fix the index or the statistics.

## Related

- [indexing.md](indexing.md)
- [query-optimization.md](query-optimization.md)
- [postgres/maintenance.md](postgres/maintenance.md)
