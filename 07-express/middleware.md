# Express middleware

## Order matters

```text
request-context (id, logger)      first: everything after can log with the id
helmet                            headers on every response, including errors
cors                              before body parsing so preflights are cheap
express.json({ limit })           body parsing with a size cap
cookieParser                      before auth (refresh cookie)
rate limiters                     global loose limit here; strict ones per route
routers                           public routers first, unprefixed router last
notFound                          after routers
errorHandler                      last; 4 arguments
```

## Kinds

| Kind | Applied | Examples |
| --- | --- | --- |
| Global | `app.use(fn)` | context, headers, parsing |
| Router-scoped | `router.use(fn)` | `authenticate` for a private module |
| Route-scoped | `router.get(path, fn, handler)` | `requirePermission('x')`, strict rate limit on login |
| Error | `app.use((err, req, res, next) => ...)` | one, last |

Prefer route-scoped for anything that varies by route. Router-scoped
`.use()` inside a router mounted without a prefix is the classic
shadowing bug ([production-structure.md](production-structure.md)).

## Writing middleware

```ts
// middleware/authenticate.ts
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next(new UnauthorizedError());
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name ?? payload.email, permissionKeys: payload.permissionKeys };
    req.log = req.log.child({ userId: req.user.id });
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
```

```ts
// middleware/require-permission.ts
export const requirePermission = (key: string) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!req.user.permissionKeys.includes(key)) return next(new ForbiddenError());
  next();
};
```

Rules:

- Call `next()` exactly once, or send a response, never both.
- Pass errors with `next(err)`; don't respond from middleware except for terminal ones (rate limit).
- Don't do business logic in middleware; it's for cross-cutting concerns.
- Type `req.user` via declaration merging in `types/express.d.ts`.

```ts
declare global {
  namespace Express {
    interface Request { id: string; log: Logger; user?: AuthUser; }
  }
}
```

## Third-party middleware worth using

`helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `compression`
(only if not compressed at the edge). Avoid `body-parser` (built in),
`morgan` (use pino), `express-session` unless you chose server sessions.

## Related

- [error-handling.md](error-handling.md)
- [security.md](security.md)
