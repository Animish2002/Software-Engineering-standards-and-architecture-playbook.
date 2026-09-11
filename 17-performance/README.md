# 17 — Performance

**Measure first, optimise second.** Every page here starts with how to
find the problem, because most performance work done without measurement
optimises the wrong thing.

| Document | Answers |
| --- | --- |
| [profiling.md](profiling.md) | How to find the slow part: request logs, `EXPLAIN`, CPU profiles, browser tools, load generation. |
| [database.md](database.md) | Indexes, plans, pools, N+1, transactions, lock contention. |
| [backend.md](backend.md) | Async I/O, round trips, serialization, compression, pagination, rate limiting. |
| [api.md](api.md) | Contract-level wins: screen-shaped endpoints, batching, caching headers, payload size. |
| [caching.md](caching.md) | Where caching helps, where it hides bugs. |
| [frontend.md](frontend.md) | Code splitting, rendering, lists, images, network. |
| [performance-checklist.md](performance-checklist.md) | Pre-ship list. |

## Order of investigation (almost always)

```text
1. Which request/screen is slow?            request logs, browser Network tab
2. Is it the database?                      query timing, EXPLAIN ANALYZE        ← 70% of cases
3. Is it round trips?                       count queries/calls per request      ← 15%
4. Is it the event loop / CPU?              lag metric, CPU profile              ← 5%
5. Is it the payload / network?             sizes, compression, waterfall       ← 5%
6. Is it rendering?                         React Profiler                       ← 5%
```

## Budgets worth stating up front

| Metric | Target |
| --- | --- |
| API p95 for list/detail endpoints | < 200 ms at realistic data volume |
| API p95 for mutations | < 300 ms |
| Queries per request | ≤ 3 for reads (1 ideal), ≤ 5 for writes |
| Initial JS bundle (gzipped) | < 250 KB for the shell; routes lazy |
| LCP / INP / CLS | < 2.5 s / < 200 ms / < 0.1 |

Write the project's own budgets in its README and test the API ones in
the latency suite.
