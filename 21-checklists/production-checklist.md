# Production readiness checklist

## Configuration

- [ ] Config validated at boot; no secret defaults; `.env.example` complete.
- [ ] Separate DB, bucket, secrets, email identity per environment.
- [ ] `NODE_ENV=production`; `CORS_ORIGIN` exact; cookies `Secure`.

## Runtime

- [ ] Compiled build; source maps; heap limit set; non-root container (if Docker).
- [ ] Graceful shutdown on SIGTERM; timeouts on server and outbound calls.
- [ ] Body limits; rate limits; security headers.
- [ ] Unhandled errors crash and restart; platform restart policy on.

## Data

- [ ] Migrations applied via deploy step; `db:check` green; `EXPECTED_INDEXES` current.
- [ ] Backups automated; restore tested; PITR if available.
- [ ] Demo seed cannot run in production.
- [ ] Pool sized for instance count.

## Observability

- [ ] Structured logs with request ids shipped to a searchable place; redaction on.
- [ ] `/health` (public liveness) and `/health/system` (privileged diagnostics, always 200 with status).
- [ ] External uptime monitor; alerts on 5xx rate, health `down`, restarts.
- [ ] Error reporting from the frontend.

## Security

- [ ] [security-checklist.md](security-checklist.md) walked with evidence.
- [ ] Edge protection (WAF, rate rules) on; Access in front of internal tools.

## Performance

- [ ] [performance-checklist.md](performance-checklist.md) walked at realistic volume.
- [ ] Latency test suite passing against a perf-seeded staging DB.

## Delivery

- [ ] CI enforces lint/typecheck/tests/build/audit; branch protection on.
- [ ] Staging deploy automatic; production on tag with approval.
- [ ] Rollback procedure written and tried once.
- [ ] `docs/DEPLOYMENT.md` accurate (build/start commands, env vars, monorepo gotchas).

## Product

- [ ] README lists endpoints, permissions, schema, routes, known gaps.
- [ ] CHANGELOG current.
- [ ] Support path: who gets paged, where the runbook is.
