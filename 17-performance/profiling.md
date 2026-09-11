# Profiling: finding the slow part

## Backend

| Question | Tool |
| --- | --- |
| Which routes are slow? | Request log summary lines (route pattern, ms, status) → aggregate p95 per route (log query or a quick script) |
| Which queries are slow? | `pg_stat_statements` ordered by `total_exec_time`; `log_min_duration_statement=200`; Drizzle logger with durations |
| Why is this query slow? | `EXPLAIN (ANALYZE, BUFFERS)` at realistic volume ([03-databases/explain.md](../03-databases/explain.md)) |
| How many queries per request? | Count Drizzle log lines per request id; or a counter in the pool wrapper |
| Is the event loop blocked? | `monitorEventLoopDelay` p99 logged; `clinic doctor` |
| Where is CPU going? | `node --cpu-prof` under load → Chrome DevTools Performance |
| Is memory growing? | `process.memoryUsage()` trend; heap snapshots ([06-nodejs/memory.md](../06-nodejs/memory.md)) |
| Is the pool saturated? | `pool.waitingCount`, `pg_stat_activity` wait events |
| How does it behave under load? | `autocannon -c 50 -d 30 <url>` or `k6` against a seeded staging DB |

## Frontend

| Question | Tool |
| --- | --- |
| What loads and in what order? | Network tab with throttling (Fast 3G / 4G); look for waterfalls |
| What's in the bundle? | `vite build` output; `rollup-plugin-visualizer` |
| What re-renders? | React DevTools Profiler, "Highlight updates" |
| Core Web Vitals? | Lighthouse; `web-vitals` library reporting to logs in production |
| Long tasks / jank? | Performance panel; look for > 50 ms tasks |
| Memory leaks in SPA? | DevTools Memory: heap snapshots after navigating back and forth |

## Realistic data

Profiling a 100-row dev database proves nothing. Keep a `seed:perf`
script that generates volume (tens of thousands of rows per hot table,
several tenants) and run investigations against it.

## Recording results

For any performance change, the PR includes: the measurement before, the
change, the measurement after, and how it was measured. Without the
numbers, it's a guess.

## Latency test suite

A small API test that logs in, hits the top endpoints N times against the
perf-seeded DB, and asserts p95 below a threshold. It fails when a
migration forgets an index or a refactor introduces N+1. See
[16-testing/api-testing.md](../16-testing/api-testing.md).

## Related

- [database.md](database.md)
- [06-nodejs/performance.md](../06-nodejs/performance.md)
