# Observability checklist

Run this before the first production deploy, and again whenever a new service
or worker is added.

## Foundation

- [ ] Structured JSON logs to stdout, no bare `console.log` ([00-engineering-principles/logging.md](../00-engineering-principles/logging.md)).
- [ ] Request id generated or propagated, on every log line and in `X-Request-Id`.
- [ ] Redaction covers auth headers, cookies, passwords, tokens.
- [ ] Health endpoints: `/health` liveness, `/health/system` diagnostics ([02-backend/production-readiness.md](../02-backend/production-readiness.md)).

## Uptime

- [ ] External uptime check hitting `/health`, hosted outside your infrastructure.
- [ ] It alerts a human, and the path has been tested.

## Errors

- [ ] Error tracker initialised before other imports, with `environment` and `release`.
- [ ] Only 5xx and unhandled exceptions captured; 4xx stay in logs.
- [ ] Request id attached as a tag.
- [ ] Headers, bodies, and query strings scrubbed; user context is the id only.
- [ ] Source maps uploaded in CI, not served publicly.
- [ ] Background workers report too.

## Metrics

- [ ] Request rate, error rate, and latency histogram per route pattern.
- [ ] Node defaults collected (event loop lag, heap).
- [ ] DB pool utilisation and wait count.
- [ ] Job duration, failure count, queue depth, dead-letter count.
- [ ] A few business counters by result.
- [ ] No unbounded label values; `/metrics` is privileged.

## Alerts

- [ ] Service down, error rate, and latency alerts exist.
- [ ] New-exception and job dead-letter alerts exist.
- [ ] A "traffic dropped to zero" alert exists.
- [ ] Page vs ticket decided per alert; pages are rare and actionable.
- [ ] Every paging alert links to a runbook.
- [ ] An SLO for the critical path, with a written error-budget policy.

## Dashboards

- [ ] A one-screen service health dashboard, linked from the alerts.
- [ ] Deploy markers on the time-series panels.
- [ ] A product health view with core business events.
- [ ] Definitions stored in the repository.

## Frontend

- [ ] Browser error tracking with `denyUrls` tuned and an error boundary in place.
- [ ] Core Web Vitals reported via `sendBeacon`, tracked at p75.
- [ ] Failed API calls captured with `X-Request-Id`.
- [ ] Inputs scrubbed; session replay off or fully masked.

## Tracing (only if justified)

- [ ] A written question that logs and metrics could not answer.
- [ ] `traceId` on every log line; sampling configured.
- [ ] Context propagated across queues and jobs.

## Habits

- [ ] Weekly error triage.
- [ ] Monthly alert review; non-actionable alerts deleted.
- [ ] Release health checked after each deploy.

## Related

- [README.md](README.md)
- [21-checklists/production-checklist.md](../21-checklists/production-checklist.md)
