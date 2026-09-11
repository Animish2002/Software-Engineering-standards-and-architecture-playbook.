# Security on Cloudflare

## In front of the origin (any backend)

- **Proxy on** (orange cloud) for the API and frontend hostnames so the origin IP isn't exposed; restrict the origin's firewall to Cloudflare IPs if it's a VM.
- **TLS**: Full (strict); HSTS enabled; minimum TLS 1.2.
- **WAF managed rules** on; OWASP core ruleset at a sane sensitivity.
- **Rate-limiting rules** for `/auth/*` (per IP) and public endpoints; cheaper and earlier than in-app limits (keep the in-app ones too).
- **Bot Fight Mode** / Turnstile for login and signup forms: `TURNSTILE_SECRET_KEY` verified server-side; the always-pass test key under `NODE_ENV=test`.
- **Cache Rules**: never cache authenticated API paths.
- **Access (Zero Trust)** to gate internal tools (admin dashboards, staging) behind SSO without building auth for them.

## Workers

- Secrets via `wrangler secret`; never in `vars`.
- Validate `env` once; fail closed.
- Same app-level rules as any API: auth on every non-public route, permission keys, input validation, exact-origin CORS, security headers (`hono/secure-headers`).
- `waitUntil` tasks catch their own errors.
- Service bindings for internal Worker-to-Worker traffic instead of public URLs.

## R2

- API tokens scoped to **one bucket**, object read/write only. Bucket-admin actions stay in the dashboard.
- Presigned URLs: minutes-long expiry; server-chosen keys; content-type constraints; never a token that can list the bucket handed to a browser.
- CORS allowed origins = frontend origin(s) only; methods `GET, PUT, HEAD`.
- Separate buckets and preferably separate accounts per environment.
- Public buckets only for truly public assets; everything else via presigned URLs or a Worker that checks auth.

## Pages

- Preview deployments are public by default; put Access in front if they show real data, or point previews at a staging API with seeded data.
- Environment variables in Pages are public at build time; no secrets.

## Logging

- `wrangler tail` / Workers Logs with request ids; redact tokens before logging.

## Checklist

- [ ] Proxy + Full (strict) TLS + HSTS.
- [ ] WAF managed rules; rate-limiting rules on auth.
- [ ] Turnstile on login/signup (with the test key in test).
- [ ] No secrets in `vars`, Pages env, or the repo.
- [ ] R2 token bucket-scoped; CORS to the frontend origin only; per-env buckets.
- [ ] Access in front of staging/internal tools.

## Related

- [15-security/security-checklist.md](../15-security/security-checklist.md)
- [bindings.md](bindings.md)
