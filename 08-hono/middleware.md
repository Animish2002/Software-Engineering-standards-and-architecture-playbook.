# Hono middleware

## Shape

```ts
import { createMiddleware } from 'hono/factory';

export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) throw new UnauthorizedError();
  const payload = await verifyAccessToken(token, c.env.JWT_SECRET);   // Web Crypto; async
  c.set('user', { id: payload.sub, email: payload.email, name: payload.name, permissionKeys: payload.permissionKeys });
  await next();
});

export const requirePermission = (key: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) throw new UnauthorizedError();
    if (!user.permissionKeys.includes(key)) throw new ForbiddenError();
    await next();
  });
```

- `await next()` exactly once. Code after it runs on the way out (response headers, timing).
- Throw errors; `app.onError` maps them ([error-handling.md](error-handling.md)).
- `c.set`/`c.get` for per-request values, typed via `Variables`.

## Request context

```ts
export const requestContext = createMiddleware<AppEnv>(async (c, next) => {
  const reqId = c.get('requestId');            // from hono/request-id
  const log = createLogger({ reqId });
  c.set('log', log);
  const start = Date.now();
  await next();
  c.header('X-Request-Id', reqId);
  if (c.req.path !== '/health') log.info({ method: c.req.method, path: c.req.routePath, status: c.res.status, ms: Date.now() - start }, 'request');
});
```

## Built-ins worth using

| Middleware | Use |
| --- | --- |
| `hono/cors` | Exact origin; `credentials: true` only with cookies |
| `hono/secure-headers` | Security headers |
| `hono/request-id` | `X-Request-Id` generation/propagation |
| `hono/logger` | Dev-only text logger; use your JSON logger in production |
| `hono/jwt` / `hono/bearer-auth` | Ready-made auth when your payload needs are simple; custom middleware when you embed permission keys |
| `hono/cache` | Cache API for public GETs on Workers |
| `hono/timing` | Server-Timing headers in dev |
| `hono/body-limit` | Request body size cap |
| `hono/etag` | Conditional GETs on public resources |

## Ordering

```text
requestId → requestContext → secureHeaders → cors → bodyLimit → routes (auth per sub-app/route) → notFound → onError
```

## Related

- [07-express/middleware.md](../07-express/middleware.md) (same concepts)
