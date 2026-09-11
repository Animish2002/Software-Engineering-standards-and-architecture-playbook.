# Deploying to Cloudflare

## Workers

```bash
npx wrangler login                     # once, interactive; CI uses CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npx wrangler deploy --env staging
npx wrangler deploy --env production
npx wrangler versions list             # see deployed versions
npx wrangler rollback                  # roll back to a previous version
```

- `compatibility_date` pinned and bumped deliberately.
- One `env` block per environment with its own bindings; secrets set per env.
- Custom domain via `routes` in config or the dashboard (`api.example.com`).
- Gradual rollouts (`wrangler versions deploy` with percentages) for risky changes.

### CI (GitHub Actions)

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: deploy --env production
```

Run typecheck, lint, tests, and `wrangler deploy --dry-run --outdir dist`
(bundle check) before the deploy step. Database migrations run before the
deploy against the target environment.

## Pages (frontend)

- Connect the Git repo in the dashboard, or deploy from CI with `wrangler pages deploy dist --project-name app`.
- Build command `npm run build -w apps/web` from the repo root (monorepo), output `apps/web/dist`.
- SPA routing: a `_redirects` file with `/* /index.html 200`, or rely on Pages' SPA fallback for single-page apps.
- Environment variables per environment (production vs preview): `VITE_API_URL`.
- Headers: a `_headers` file for CSP and security headers on the frontend.

```text
# apps/web/public/_headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://api.example.com https://<r2-endpoint>; img-src 'self' data: blob: https://<r2-endpoint>; script-src 'self'; style-src 'self' 'unsafe-inline'
```

## Environments and promotion

```text
feature branch → Pages preview + (optional) Worker preview/staging env
main           → staging env
tag / release  → production env
```

Never share buckets, KV namespaces, or databases across environments.

## Rollback

- Workers: `wrangler rollback` (instant, previous version).
- Pages: promote a previous deployment in the dashboard.
- Database migrations are fix-forward ([03-databases/migrations.md](../03-databases/migrations.md)).

## Observability

- Workers Logs / `wrangler tail`; enable `observability` in config.
- Analytics per Worker (requests, errors, CPU time) in the dashboard.
- Alerts: Cloudflare notifications on error-rate spikes; external uptime check on `/health`.

## Related

- [18-devops/ci-cd.md](../18-devops/ci-cd.md)
- [18-devops/environments.md](../18-devops/environments.md)
