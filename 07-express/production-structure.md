# Express in production

## Router mounting rules (the bug that keeps recurring)

```ts
// Avoid
app.use(itemsRouter);        // itemsRouter has router.use(authenticate) at the top
app.use('/shares', sharesRouter);   // contains public GET /public/:token → now returns 401
```

A router mounted at `/` sees every request. Its blanket `authenticate`
runs before `/shares/public/:token` is ever reached.

```ts
// Recommended
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/shares', sharesRouter);
app.use(itemsRouter);                // the one unprefixed router (spans /items, /folders, /files) goes LAST
```

Rules:

1. Every single-prefix router is mounted with its prefix.
2. Unprefixed routers (only when a router genuinely spans several prefixes) are mounted last.
3. Inside a router, public routes are registered **before** `router.use(authenticate)`, or auth is applied per route.
4. Health endpoints get their middleware per-route, never a router-wide `.use()`, so the public liveness probe can't be swallowed.

## Health

```ts
healthRouter.get('/', (_req, res) => res.json(ok({ status: 'ok' })));                       // liveness: no DB
healthRouter.get('/system', authenticate, requirePermission('system:health'), c.system);     // diagnostics, always 200
```

## Timeouts

```ts
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 65_000;   // > load balancer idle timeout (often 60 s) to avoid 502s on reuse
```

## Build and run

```json
{ "build": "tsc -p tsconfig.json", "start": "node --enable-source-maps dist/server.js" }
```

- Monorepo: build packages first; the platform's build command must run from the root with workspaces installed.
- `NODE_ENV=production` set by the platform.
- Migrations as a deploy step ([03-databases/migrations.md](../03-databases/migrations.md)).

## Test mode

`NODE_ENV=test` disables rate limiting and swaps the bot-protection
secret for the always-pass test key so the API test suite can run. It
must not change auth or permission behaviour.

## Checklist

- [ ] Prefixed mounting; unprefixed last; public routes before auth.
- [ ] Health liveness without DB; diagnostics privileged and always 200.
- [ ] Server timeouts set; keep-alive > LB idle timeout.
- [ ] Graceful shutdown wired ([06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md)).
- [ ] Compiled build; source maps enabled.

## Related

- [02-backend/production-readiness.md](../02-backend/production-readiness.md)
- [06-nodejs/production-checklist.md](../06-nodejs/production-checklist.md)
