# Security checklist

Copy into a project when it nears production; tick with evidence (a file,
a test, a setting).

## Identity

- [ ] Passwords hashed with bcrypt(12)/argon2id; min length 12; uniform login errors.
- [ ] Access token ≤ 15 min, `HS256` pinned, in memory on the client.
- [ ] Refresh/session token random, hashed at rest, httpOnly+Secure+SameSite=Lax cookie, rotated, revoked on logout/password change/deactivation.
- [ ] Password reset: hashed single-use token, 1 h expiry, uniform response, email failures swallowed.
- [ ] Rate limits on login/reset/signup per IP and per account; bot challenge available.
- [ ] Deactivated accounts can't log in or refresh.

## Authorization

- [ ] Every non-public route behind `authenticate` + `requirePermission(key)`.
- [ ] Permission keys, never role names, in code.
- [ ] Resource scope resolved once per request; repositories scoped by owner/tenant.
- [ ] Identity never read from body/query.
- [ ] 404 for invisible resources; tiered admin rules; self-protection rules.
- [ ] Public share tokens are read-only and subtree-scoped.
- [ ] Tenancy/permission API tests for every mutating endpoint.
- [ ] Audit log for privileged actions.

## Input/output

- [ ] Zod on every body/query/param; sizes and array lengths bounded; ids validated.
- [ ] Parameterised queries only; no `sql.raw` with user input; sort/filter columns whitelisted.
- [ ] No `dangerouslySetInnerHTML` without sanitiser; URL schemes validated.
- [ ] Filenames/headers sanitised; CSV formula injection prevented.
- [ ] Errors never leak internals.

## Transport and headers

- [ ] HTTPS everywhere; HSTS.
- [ ] `helmet`/`secureHeaders`; CSP on the frontend host; `frame-ancestors 'none'`.
- [ ] Exact-origin CORS with credentials; preflight before auth.
- [ ] `Cache-Control: private, no-store` on authenticated responses.
- [ ] `trust proxy` set to the real hop count.

## Secrets and config

- [ ] No secrets in Git (scanner enabled), images, URLs, logs, or `VITE_*`.
- [ ] Separate secrets/DB/buckets per environment; least-privilege tokens (R2 bucket-scoped, DB role DML-only).
- [ ] Config validated at boot; no defaults for secrets.
- [ ] Rotation procedure written down.

## Storage and files

- [ ] Uploads/downloads via short-lived presigned URLs; server-chosen keys; type/size constraints.
- [ ] User files served from a separate origin; untrusted types as attachments.
- [ ] Bucket CORS limited to the frontend origin.

## Platform

- [ ] Dependencies audited; lockfile; Dependabot; Actions pinned.
- [ ] Containers non-root, read-only FS, dropped caps, scanned.
- [ ] WAF/rate-limiting rules at the edge; Access in front of internal tools.
- [ ] Backups tested; logs retained; alerts on auth-failure spikes and 5xx.

## Related

- [21-checklists/security-checklist.md](../21-checklists/security-checklist.md) (short form)
