# CORS

## What it does

CORS is a **browser** mechanism that decides whether a page from origin A
may *read* responses from origin B (and, via preflight, whether it may
send non-simple requests at all). It protects users of browsers from
malicious pages; it does nothing against curl, servers, or a malicious
user with their own token.

CORS is **not** an authentication or authorization control.

## Configuration

```ts
cors({
  origin: config.CORS_ORIGIN,                 // exact origin string, or a function checking an allow-list
  credentials: true,                          // only because the refresh cookie needs it; requires an exact origin (not '*')
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,                                // cache preflights
})
```

Multiple environments (local, preview, production):

```ts
const allowed = new Set(config.CORS_ORIGINS);   // from env, comma-separated
origin: (origin, cb) => cb(null, !origin || allowed.has(origin) ? origin : false)
```

`!origin` allows non-browser clients (no Origin header), which is fine
because CORS isn't what protects them.

## Rules

- Never `origin: '*'` together with `credentials: true` (browsers reject it anyway).
- Never reflect the request's `Origin` blindly (`origin: true`) on an API with cookies; that equals `*` with credentials.
- Public, unauthenticated read endpoints (`/shares/public/:token`) can be more permissive, but keep credentials off for them.
- Preflight (`OPTIONS`) must pass before auth middleware; `cors()` handles it when registered early.
- Object storage (R2) CORS is configured on the bucket and must allow the **frontend** origin, `PUT`/`GET`, and `Content-Type`; the API's origin is irrelevant there because the browser talks to the bucket directly.

## Debugging

"CORS error" in the console usually means: wrong origin string (trailing
slash, `http` vs `https`), a header not in `allowedHeaders`, the preflight
hitting an auth middleware (401 on OPTIONS), or the server crashing before
setting headers (a 500 has no CORS headers, so the browser reports CORS
instead of the real error; check the API logs).

## Related

- [csrf.md](csrf.md)
- [09-cloudflare/bindings.md](../09-cloudflare/bindings.md) (R2 CORS)
