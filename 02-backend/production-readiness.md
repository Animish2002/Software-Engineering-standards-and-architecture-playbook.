# Production readiness (backend)

What a backend must have before real users hit it. The one-page checklist is
[21-checklists/production-checklist.md](../21-checklists/production-checklist.md);
this page explains each item.

## Health endpoints

| Endpoint | Auth | Checks | Used by |
| --- | --- | --- | --- |
| `GET /health` | None | Process is up (no DB call) | Platform liveness probe |
| `GET /health/ready` | None | DB reachable (bounded timeout) | Load balancer readiness (optional) |
| `GET /health/system` | Privileged | DB latency, expected indexes present, storage reachable, uptime, version | Ops page in the product |

The diagnostic endpoint always returns **200** with a `status` field
(`ok`/`degraded`/`down`) in the body; a 5xx would make the page reporting
an outage look like the outage.

## Graceful shutdown

```ts
const server = app.listen(config.PORT);
const shutdown = (signal: string) => {
  logger.info({ signal }, 'shutting down');
  server.close(async () => { await db.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();   // hard deadline
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

Stop accepting connections, finish in-flight requests, close the pool, exit.
See [06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md).

## Limits and protection

- Body size limit on the JSON parser (1 MB unless uploads go through the server; they shouldn't, use presigned URLs).
- Rate limiting on auth routes (strict) and globally (loose), keyed by IP behind `trust proxy`.
- Timeouts: server `requestTimeout`/`headersTimeout`; outbound calls with `AbortSignal.timeout()`.
- Array/page-size caps in schemas.

## Headers

- `helmet()` (Express) or `secureHeaders()` (Hono) for security headers.
- CORS with the exact origin and `credentials: true` only if cookies are used.
- `X-Request-Id` echoed.
- `Cache-Control: private, no-store` on authenticated responses.

## Database

- Connection pool sized for the instance count × platform limit ([03-databases/connection-pooling.md](../03-databases/connection-pooling.md)).
- Migrations applied as a deploy step, not at process start (or at start with a lock, for single-instance platforms).
- `db:check`-style script to verify migrations and indexes match the code.

## Observability

- Structured logs to stdout, request id on every line.
- Error rate and p95 latency visible somewhere (platform metrics or a log query).
- Alert on 5xx rate and on health `down`.

## Process

- `NODE_ENV=production`.
- Run compiled JS from `dist/`, not `tsx`.
- One process per container/instance; scale by instances, not `cluster`, unless the platform lacks horizontal scaling.
- Restart on crash (platform does this); never `try/catch` around the whole server to keep it alive in a broken state.

## Related

- [06-nodejs/production-checklist.md](../06-nodejs/production-checklist.md)
- [13-docker/production-checklist.md](../13-docker/production-checklist.md)
- [15-security/security-checklist.md](../15-security/security-checklist.md)
