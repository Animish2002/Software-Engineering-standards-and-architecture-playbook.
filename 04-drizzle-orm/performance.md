# Drizzle performance

Drizzle adds very little on top of the driver; performance problems are
almost always the SQL it emits. Fix the SQL.

## See what runs

```ts
export const db = drizzle(pool, { schema, logger: process.env.DB_LOG === '1' });
```

Or a custom logger that includes the request id and duration:

```ts
const logger = { logQuery(query: string, params: unknown[]) { log.debug({ query, params }, 'sql'); } };
```

Copy the logged SQL into `EXPLAIN (ANALYZE, BUFFERS)`
([03-databases/explain.md](../03-databases/explain.md)).

## The usual fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Many similar queries per request | Loop calling a repository per item (N+1) | `inArray`, join, or `db.query` with `with` |
| Slow list endpoint | Missing composite index; `Seq Scan` + `Sort` | Index matching `WHERE` + `ORDER BY` ([indexing.md](indexing.md)) |
| Large payloads | `select()` with no columns (all columns, including big text/JSON) | Explicit column objects |
| Deep pages slow | `offset` | Keyset ([queries.md](queries.md)) |
| Breadcrumbs/tree slow | Walking in JS | Recursive CTE via `sql` |
| Counts slow | `count(*)` over big filtered sets each page | `hasMore` instead of totals; cached counters |
| Spiky latency | Pool exhausted; long transactions | Pool sizing; short transactions ([03-databases/connection-pooling.md](../03-databases/connection-pooling.md)) |
| Workers CPU time | Building large queries per request | Prepared statements ([prepared-statements.md](prepared-statements.md)); simpler queries |

## Batching

```ts
// one round trip for several independent statements (Postgres)
const [items, crumbs, sizes] = await db.batch([...])   // available on some drivers (neon-http, d1); otherwise:
const [items, crumbs, sizes] = await Promise.all([listChildren(...), getBreadcrumbs(...), getFolderSizes(...)]);
```

`Promise.all` runs them concurrently on separate pooled connections; that
is usually enough.

## Relational API cost

`db.query.x.findMany({ with })` builds one SQL statement using JSON
aggregation. It is efficient, but for large nested sets the JSON build and
parse costs CPU. For big lists with one level of children, a join with
explicit columns is cheaper.

## Bigints and dates

`bigint` columns with `mode: 'number'` avoid `BigInt` boxing. `timestamp`
returns `Date` objects; serialise once at the API boundary.

## Checklist

- [ ] Query logging available via an env flag.
- [ ] No N+1 in list endpoints.
- [ ] Explicit columns on hot reads.
- [ ] Independent queries run with `Promise.all`.
- [ ] `EXPLAIN ANALYZE` numbers recorded for the top 5 endpoints.

## Related

- [03-databases/query-optimization.md](../03-databases/query-optimization.md)
- [17-performance/database.md](../17-performance/database.md)
