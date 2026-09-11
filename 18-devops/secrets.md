# Secrets in CI/CD and platforms

Policy: [15-security/secrets.md](../15-security/secrets.md). This is the
mechanics.

## GitHub Actions

- **Repository secrets** for CI-only values (test JWT secrets).
- **Environment secrets** (`staging`, `production`) for deploy credentials, scoped so a PR from a fork can't read production values.
- Required reviewers on the `production` environment.
- `permissions:` minimal per workflow; `GITHUB_TOKEN` read-only unless the job writes.
- Never `echo` a secret; masked but still risky in multi-line output.
- Prefer OIDC federation (cloud providers, Cloudflare via API tokens scoped narrowly) over long-lived keys.

## Platforms

| Platform | Where | Notes |
| --- | --- | --- |
| Railway | Service variables per environment; "shared variables" for cross-service | Reference variables (`${{Postgres.DATABASE_URL}}`) avoid copying |
| Cloudflare Workers | `wrangler secret put --env` or dashboard | Per environment; not in `wrangler.jsonc` |
| Cloudflare Pages | Project env vars (production/preview) | Public at build; no secrets |
| Kubernetes | External secret store → Secret | [14-kubernetes/secrets.md](../14-kubernetes/secrets.md) |

## Local

`.env.local` / `.dev.vars` git-ignored; `.env.example` committed with
placeholders. Optionally a password-manager CLI (`op run --env-file`) so
no plaintext file exists at all.

## Rotation runbook (write one per project)

1. Generate the new value.
2. For signing secrets: deploy with both old and new accepted (dual verify), then switch signing to new, then remove old after the old tokens' max lifetime.
3. For API keys/DB passwords: create the new credential, update platform secrets, redeploy, verify, revoke the old.
4. Record the rotation date.

## Incident

Secret exposed (commit, log, screenshot): rotate immediately; assume
compromised; check logs for use; then fix the leak path (scanner, hook).

## Related

- [ci-cd.md](ci-cd.md)
- [environments.md](environments.md)
