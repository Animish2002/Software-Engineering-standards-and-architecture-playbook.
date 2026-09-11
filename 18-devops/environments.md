# Environments

| Environment | Purpose | Data | Deployed from | Secrets |
| --- | --- | --- | --- | --- |
| **local** | Development on a laptop | Docker Postgres; dev R2 bucket (or a local fake); demo seed | `npm run dev:*` | `.env.local` |
| **test** | Automated tests (local + CI) | Throwaway DB, truncated per test; test keys; email captured | CI job | CI variables |
| **preview** (optional) | Per-PR frontend preview | Points at staging API | Pages preview | Public build vars only |
| **staging** | Pre-production verification | Its own DB (seeded or anonymised); its own bucket | Push to `main` | Platform env `staging` |
| **production** | Live | Real | Tag/release | Platform env `production`; separate accounts for storage where feasible |

## Rules

- **Nothing shared across environments**: not the database, not the bucket, not the secrets, not the email sender identity (use a subdomain per env if needed).
- **Same code, different config.** Behaviour differences come only from validated env vars, and only for the documented test-mode switches (rate limits, bot-protection key, email transport). Never for auth.
- **Production data never flows down** unless anonymised. Staging gets a seed or a scrubbed snapshot.
- **Demo seeds never run in production.** The seed script refuses when `NODE_ENV=production`; the production-safe seed only reconciles reference data.
- **Environment name in logs** (`env` field) and in the health payload.
- **Parity**: same Node major, same Postgres major, same migrations applied (`db:check` on every environment after deploy).

## Naming resources

`<app>-<resource>-<env>`: `app-files-dev`, `app-files-prod`; Railway
environments `development`/`production`; Wrangler `env.staging`/`env.production`.

## Promotion

```text
feature branch → CI → merge to main → staging (auto) → verify → tag → production
```

Verification on staging: smoke test the primary flows, check `/health/system`,
watch logs for a few minutes.

## Related

- [ci-cd.md](ci-cd.md)
- [02-backend/configuration.md](../02-backend/configuration.md)
- [secrets.md](secrets.md)
