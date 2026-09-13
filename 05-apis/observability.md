# API observability

The request-level minimum for an API. Metrics, error tracking, alerting,
SLOs, dashboards, and tracing are covered in depth in
[27-observability/](../27-observability/).

## The three questions

1. **Is it up?** Health endpoints + external uptime check.
2. **Is it slow or failing?** Request logs → error rate and latency per route.
3. **Why?** Request id to correlate logs, and (when needed) traces across hops.

## Minimum viable (every project)

- Request id generated or propagated (`X-Request-Id`), returned in the response, on every log line ([00-engineering-principles/logging.md](../00-engineering-principles/logging.md)).
- One structured request log line per request: route pattern, method, status, duration, user id.
- Errors logged with stack + request id at the error middleware.
- `/health` liveness (public) and `/health/system` diagnostics (privileged, always 200 with `status`).
- Platform metrics (CPU, memory, restarts) from the host.
- An external uptime monitor hitting `/health` every minute with alerting.

## Next step (when the minimum can't answer a question)

- **Metrics**: count + histogram per route (`http_requests_total`, `http_request_duration_ms`) via `prom-client` or the platform's metrics. Alert on 5xx rate and p95.
- **Slow query log**: `pg_stat_statements` + `log_min_duration_statement`.
- **Tracing** (optional tier): OpenTelemetry SDK with auto-instrumentation for HTTP + pg, exported to a hosted backend. Add it when a latency problem spans services or when "which query in this request was slow" is a recurring question.
- **Frontend error reporting**: window `error`/`unhandledrejection` → an endpoint or a hosted service, with the request id of the failed API call.

## Dashboards worth having

- Requests/min, error rate, p50/p95/p99 per route (top 10).
- DB pool usage and query latency.
- Auth failures/min (spikes = attack).
- Queue depth and job failures (if jobs exist).

## Don't

- Log every request body.
- Alert on individual errors; alert on rates and health.
- Add tracing before logs are structured.

## Related

- [27-observability/README.md](../27-observability/README.md)
- [02-backend/logging.md](../02-backend/logging.md)
- [02-backend/production-readiness.md](../02-backend/production-readiness.md)
- [17-performance/profiling.md](../17-performance/profiling.md)
