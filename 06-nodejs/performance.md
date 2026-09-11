# Node.js performance

Measure first: [17-performance/README.md](../17-performance/README.md).
Most "Node is slow" reports are a slow query or a blocked event loop.

## Order of investigation

1. **Request timings by route** (request log). Which routes are slow?
2. **Database time** for those routes (query log / `pg_stat_statements`). Usually the answer. Fix with [03-databases/query-optimization.md](../03-databases/query-optimization.md).
3. **Round trips**: count queries and outbound calls per request; parallelise or combine.
4. **Event-loop lag**: if p99 lag is high, find the synchronous hot spot with `--cpu-prof`.
5. **Memory / GC**: rising heap and long GC pauses ([memory.md](memory.md)).
6. Only then: JSON size, compression, serialization micro-costs.

## Common wins

| Win | Effect |
| --- | --- |
| Fix N+1 and add the right index | 10-1000× on the affected route |
| `Promise.all` independent I/O | Latency drops to the slowest call |
| One screen-shaped endpoint instead of 5 calls | Removes 4 network round trips from the client |
| Presigned URLs instead of proxying file bytes | Removes upload/download load entirely |
| Response compression (`compression` middleware or at the edge) | Smaller payloads; do it at the CDN/proxy if possible |
| Keep-alive on outbound `fetch`/`http.Agent` | Avoids TLS handshakes per call |
| Async bcrypt with cost 10-12 | Keeps the loop free during logins |
| `NODE_ENV=production` | Library fast paths |
| Compiled `dist/` not `tsx` | Faster startup, less memory |

## Things that rarely matter

- Choosing Fastify over Express for a CRUD API backed by a database (framework overhead is a rounding error next to a 5 ms query).
- Micro-optimising loops and object shapes.
- `cluster` when you can run more instances.

## Profiling

```bash
node --cpu-prof --cpu-prof-dir=./profiles dist/server.js   # then load .cpuprofile in Chrome DevTools > Performance
node --inspect dist/server.js                              # attach DevTools for live profiling
npx clinic doctor -- node dist/server.js                   # event-loop, GC, I/O overview
npx autocannon -c 50 -d 20 http://localhost:4000/items     # load generator
```

Profile under realistic load with realistic data, not on an idle dev box.

## Related

- [event-loop.md](event-loop.md)
- [memory.md](memory.md)
- [17-performance/backend.md](../17-performance/backend.md)
