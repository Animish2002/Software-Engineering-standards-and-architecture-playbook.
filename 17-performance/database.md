# Database performance

The detailed material is in [03-databases/](../03-databases/README.md).
This is the ordered playbook.

## 1. Indexes

Every FK indexed; every hot `WHERE` + `ORDER BY` combination has a
composite index (equality first, sort last); partial indexes on active
rows; no redundant single-column indexes. Verify with `EXPLAIN` and with
a check that production actually has them ([03-databases/indexing.md](../03-databases/indexing.md)).

## 2. Query plans

`Seq Scan` on a big table with a selective filter, `Sort` over thousands of
rows before a `LIMIT`, `Nested Loop` with a huge inner `loops=` count,
estimated vs actual rows off by 10×: each has a known fix
([03-databases/explain.md](../03-databases/explain.md)).

## 3. N+1 and round trips

One query per item in a loop, or five sequential queries that could be
one join or a `Promise.all`. Count queries per request; the target is 1-3
([03-databases/query-optimization.md](../03-databases/query-optimization.md)).

## 4. Tree walks and aggregates

Breadcrumbs, descendant lists, folder sizes: recursive CTEs with a depth
guard, not application loops. Cache or denormalise aggregates only after
the CTE is measured too slow
([03-databases/relationships.md](../03-databases/relationships.md), [03-databases/denormalization.md](../03-databases/denormalization.md)).

## 5. Pagination

Keyset for large/infinite lists; bounded page sizes; no `count(*)` per
page on big tables ([03-databases/pagination.md](../03-databases/pagination.md)).

## 6. Connection pool

Sized against `max_connections`; poolers for serverless; `statement_timeout`
and `idle_in_transaction_session_timeout` on the app role
([03-databases/connection-pooling.md](../03-databases/connection-pooling.md)).

## 7. Transactions and locks

Short, database-only transactions; `FOR UPDATE` on read-then-write; `SKIP
LOCKED` for queues; hot-row updates batched or moved
([03-databases/locking.md](../03-databases/locking.md)).

## 8. Statistics and maintenance

`ANALYZE` after bulk loads; autovacuum keeping up; bloat checked; unused
indexes dropped ([03-databases/postgres/maintenance.md](../03-databases/postgres/maintenance.md)).

## 9. Only then: caching and replicas

Cache reads that tolerate staleness; read replicas for read-heavy
workloads ([caching.md](caching.md)).

## Symptoms → likely cause

| Symptom | Likely |
| --- | --- |
| Slow only for users with lots of data | Missing composite/partial index; app-side tree walk |
| Slow under concurrency, fine alone | Pool exhaustion; lock contention; long transactions |
| Slow after a deploy | Migration didn't apply (index missing); new N+1 |
| Slow first page of a list | `count(*)`; `Sort` without index |
| Slow deep pages | `OFFSET` |
| Random spikes | Autovacuum on a hot table; checkpointing; a batch job |

## Related

- [profiling.md](profiling.md)
- [04-drizzle-orm/performance.md](../04-drizzle-orm/performance.md)
