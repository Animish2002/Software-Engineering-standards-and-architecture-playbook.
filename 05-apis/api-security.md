# API security (contract level)

Deep dives live in [15-security/](../15-security/README.md). This is what
the API surface must guarantee.

## Transport and auth

- HTTPS only; HSTS at the edge.
- `Authorization: Bearer <access-token>` for API calls; refresh token in an httpOnly cookie scoped to `/auth`.
- Access tokens short-lived (15 min); refresh rotated; logout revokes server-side.
- Public endpoints are explicit (`/health`, `/shares/public/*`, `/auth/login|refresh|forgot-password|reset-password`); everything else requires auth by default. Mount routers so a public router can't be shadowed by an unprefixed router's blanket auth middleware.

## Authorization

- Capability check (`requirePermission('x:y')`) on every non-public route.
- Resource scope resolved in the service; 404 for invisible resources.
- Identity never from the body or query.
- Tier rules for admin actions on other admins.

## Input

- Every param/query/body validated; sizes bounded; arrays capped on public endpoints.
- Ids validated as UUIDs.
- No user-controlled values in redirects, file paths, shell commands, or SQL strings (Drizzle parameters or `sql` tag only).

## Output

- Envelope; no internals in errors; no sensitive columns.
- `Cache-Control: private, no-store` on authenticated responses.
- Security headers (`helmet`/`secureHeaders`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or CSP `frame-ancestors`), `Referrer-Policy`, a CSP on any HTML the API serves.

## CORS

```ts
cors({ origin: config.CORS_ORIGIN, credentials: true, methods: ['GET','POST','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization','Idempotency-Key'], exposedHeaders: ['X-Request-Id'] })
```

Exact origin(s), never `*` with credentials. CORS protects browsers, not
servers: it is not an auth mechanism.

## Abuse controls

- Rate limits ([rate-limiting.md](rate-limiting.md)).
- Bot challenge (Turnstile) on login/signup once abuse is observed.
- Uniform responses for "forgot password" and bad credentials (no enumeration).
- Presigned URLs for uploads/downloads with short expiry and content-type/size constraints; the API never proxies file bytes.

## Secrets

- No secrets in URLs (they land in logs). Tokens in headers/cookies/bodies only.
- Share/reset tokens: random ≥ 32 bytes, stored hashed, single-use where applicable, expiring.

## Logging

- Request id on every response; redaction of auth headers, cookies, passwords, tokens.

## Checklist

- [ ] Every route is either explicitly public or behind `authenticate`.
- [ ] `requirePermission` on every non-public route.
- [ ] All inputs validated and bounded.
- [ ] Exact-origin CORS; security headers on.
- [ ] Rate limits on auth and public routes.
- [ ] No secrets in URLs or logs.
- [ ] Tenancy tests for every mutating endpoint.

## Related

- [15-security/security-checklist.md](../15-security/security-checklist.md)
- [02-backend/authorization.md](../02-backend/authorization.md)
