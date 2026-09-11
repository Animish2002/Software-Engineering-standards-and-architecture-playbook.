# Performance checklist

## Before optimising

- [ ] The slow path is identified from measurements (request logs, browser tools).
- [ ] Realistic data volume is available (`seed:perf`).
- [ ] Before-numbers recorded.

## Database

- [ ] Every FK indexed; hot queries have matching composite/partial indexes.
- [ ] `EXPLAIN ANALYZE` reviewed for the top 5 queries; no Seq Scan on big tables, no Sort before LIMIT.
- [ ] No N+1; ≤ 3 queries per read request.
- [ ] Tree walks in SQL (recursive CTE with depth guard).
- [ ] Keyset pagination on large lists; page sizes capped.
- [ ] Pool sized; timeouts set.
- [ ] Production indexes verified after deploy (`db:check`/health).

## Backend

- [ ] No synchronous blocking in request paths; event-loop lag monitored.
- [ ] Independent I/O parallelised.
- [ ] Explicit columns; bounded responses.
- [ ] File bytes never through the API.
- [ ] Compression at the edge.
- [ ] Expensive endpoints rate-limited.

## API

- [ ] Screen-shaped read endpoints; batch endpoints for per-item data.
- [ ] Correct `Cache-Control` per response class.

## Caching

- [ ] Only after indexing/round-trip fixes.
- [ ] Keys include identity; invalidation in the writing service; sizes bounded.

## Frontend

- [ ] Lazy routes and heavy libs; bundle analysed.
- [ ] Client cache with revalidation; no skeleton over existing data.
- [ ] Long lists virtualised/capped; per-item work gated on visibility.
- [ ] Media sized and lazy.
- [ ] Web Vitals within budget on mobile.

## After

- [ ] After-numbers recorded in the PR.
- [ ] Latency test thresholds updated if the baseline improved.

## Related

- [21-checklists/performance-checklist.md](../21-checklists/performance-checklist.md) (short form)
