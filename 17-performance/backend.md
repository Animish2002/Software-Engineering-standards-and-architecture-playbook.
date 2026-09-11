# Backend performance

## Async I/O

Node's throughput depends on never blocking the loop. No sync fs/crypto/
zlib in request paths; CPU-heavy work to a job or worker thread; long
loops yield ([06-nodejs/event-loop.md](../06-nodejs/event-loop.md)).

## Round trips

Every database query, cache call, and outbound HTTP request is a network
hop. Per request: count them, parallelise independent ones with
`Promise.all`, merge sequential ones with joins/CTEs, and return a
screen-shaped response so the client doesn't need a second round.

## Connection reuse

- DB: pool ([03-databases/connection-pooling.md](../03-databases/connection-pooling.md)).
- Outbound HTTP: keep-alive agent (Node's `fetch`/undici does this by default); reuse SDK clients (S3/R2 client created once).
- Presigning is local HMAC work: cheap, batchable, no network.

## Serialization

- JSON is fine; the cost is proportional to size. Select only needed columns; don't serialise `passwordHash` and other never-used fields; paginate.
- Dates as ISO strings once at the boundary; avoid re-parsing.
- Streams for large exports ([06-nodejs/streams.md](../06-nodejs/streams.md)).

## Compression

- At the edge/proxy (Cloudflare, ingress) rather than in Node when possible.
- If in Node, `compression` middleware with a threshold (~1 KB); skip already-compressed content types.

## Pagination and bounds

Every list bounded; every array input capped; every export streamed or
job-based.

## Rate limiting

Protects performance as much as security: a client hammering an
expensive endpoint degrades everyone. Strict limits on expensive routes
([05-apis/rate-limiting.md](../05-apis/rate-limiting.md)).

## Caching

After the above ([caching.md](caching.md)).

## Startup and memory

Compiled JS, lazy heavy imports, bounded caches, heap limit set
([06-nodejs/performance.md](../06-nodejs/performance.md)).

## Framework overhead

Express vs Fastify vs Hono differences are microseconds per request;
irrelevant next to a 5 ms query. Pick the framework for its fit
([23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md)), not for benchmarks.

## Checklist

- [ ] No synchronous blocking in request paths.
- [ ] ≤ 3 queries per read request; independent I/O parallel.
- [ ] Clients (DB pool, storage SDK) created once.
- [ ] Explicit column selection; bounded lists.
- [ ] Compression at the edge; streaming for large responses.
- [ ] Expensive endpoints rate-limited.

## Related

- [database.md](database.md)
- [api.md](api.md)
