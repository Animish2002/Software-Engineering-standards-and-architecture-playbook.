# Security checklist (short form)

Full version with evidence columns: [15-security/security-checklist.md](../15-security/security-checklist.md).

## Identity

- [ ] bcrypt(12)/argon2id; uniform login errors; rate limits per IP + account.
- [ ] Access JWT ≤ 15 min, HS256 pinned, in memory; refresh random, hashed, httpOnly+Secure+SameSite=Lax, rotated, revoked on logout/change/deactivation.
- [ ] Reset tokens hashed, single-use, 1 h, uniform response.

## Authorization

- [ ] Every non-public route: `authenticate` + `requirePermission(key)`.
- [ ] Keys not role names; scope resolved once; owner-scoped repositories; 404 for invisible.
- [ ] Tier + self-protection rules; public share tokens read-only and subtree-scoped.
- [ ] Tenancy tests for every mutating endpoint; audit log on privileged actions.

## Input / output

- [ ] Zod everywhere; bounded sizes; parameterised queries; whitelisted sort columns.
- [ ] No unsanitised HTML; URL schemes checked; headers/filenames sanitised.
- [ ] Errors never leak internals.

## Transport

- [ ] HTTPS + HSTS; helmet/secureHeaders; CSP on the frontend; exact-origin CORS; `trust proxy` correct.
- [ ] `Cache-Control: private, no-store` on authenticated responses.

## Secrets

- [ ] None in Git/images/URLs/logs/`VITE_*`; scanner on; per-environment; least-privilege tokens; rotation runbook.

## Files

- [ ] Presigned URLs, server-chosen keys, type/size limits; separate origin; bucket CORS to the frontend only.

## Platform

- [ ] Dependencies audited; lockfile; Actions pinned; containers non-root; WAF/rate rules; backups tested.
