# Performance checklist (short form)

Full version: [17-performance/performance-checklist.md](../17-performance/performance-checklist.md).

## Measure first

- [ ] Slow path identified from logs/tools; realistic data volume; before-numbers recorded.

## Database

- [ ] FKs indexed; hot queries have composite/partial indexes; `EXPLAIN ANALYZE` clean.
- [ ] No N+1; ≤ 3 queries per read; tree walks in SQL; keyset pagination.
- [ ] Pool sized; timeouts set; production indexes verified.

## Backend

- [ ] No sync blocking; independent I/O parallel; explicit columns; bounded lists.
- [ ] File bytes never through the API; compression at the edge; expensive routes rate-limited.

## API

- [ ] Screen-shaped reads; batch endpoints; correct `Cache-Control`.

## Frontend

- [ ] Lazy routes/libs; client cache with quiet revalidation; virtualised long lists; lazy media; bundle analysed; Web Vitals in budget.

## After

- [ ] After-numbers in the PR; latency test thresholds updated.
