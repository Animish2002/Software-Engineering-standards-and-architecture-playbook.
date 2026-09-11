# Node.js production checklist

- [ ] Current LTS; `engines.node` pinned; base image pinned.
- [ ] `NODE_ENV=production`.
- [ ] Runs compiled `dist/` with `--enable-source-maps`; no `tsx`/`ts-node`.
- [ ] `--max-old-space-size` set relative to the container limit.
- [ ] Config validated at boot; process exits non-zero on bad config.
- [ ] Structured JSON logs to stdout; request id on every line; redaction on.
- [ ] `unhandledRejection`/`uncaughtException` → log + exit.
- [ ] `SIGTERM`/`SIGINT` → drain, close pool, exit; hard deadline.
- [ ] Exec-form `CMD` so signals reach Node.
- [ ] `server.requestTimeout`, `headersTimeout`, `keepAliveTimeout` set; outbound calls have timeouts.
- [ ] Body size limits; rate limits on auth and public routes.
- [ ] No synchronous crypto/fs/zlib in request paths.
- [ ] DB pool sized; `statement_timeout` set on the role.
- [ ] `/health` public liveness; readiness returns 503 during shutdown.
- [ ] Health checks excluded from request logs.
- [ ] Event-loop lag and memory usage logged periodically.
- [ ] Non-root user in the container.
- [ ] Dependencies audited; lockfile committed; `npm ci` in CI.

## Related

- [02-backend/production-readiness.md](../02-backend/production-readiness.md)
- [13-docker/production-checklist.md](../13-docker/production-checklist.md)
- [21-checklists/production-checklist.md](../21-checklists/production-checklist.md)
