# 27 — Monitoring and observability

Knowing what the system is doing, and finding out something is wrong before
a user tells you.

**Logging is not repeated here.** It is the foundation and it already has a
home: [00-engineering-principles/logging.md](../00-engineering-principles/logging.md)
for how to write logs, [05-apis/observability.md](../05-apis/observability.md)
for the request-level minimum, [02-backend/production-readiness.md](../02-backend/production-readiness.md)
for health endpoints. This section covers everything that comes after
structured logs exist.

| Document | Topic |
| --- | --- |
| [metrics.md](metrics.md) | What to measure, RED and USE, `prom-client`, cardinality. |
| [error-tracking.md](error-tracking.md) | Exceptions with stack traces, grouping, releases, PII scrubbing. |
| [alerting-and-slos.md](alerting-and-slos.md) | What should wake someone, SLOs and error budgets, runbooks. |
| [dashboards.md](dashboards.md) | The three dashboards worth building. |
| [tracing.md](tracing.md) | OpenTelemetry, and the specific question that justifies it. |
| [frontend-monitoring.md](frontend-monitoring.md) | Web Vitals, JS errors, API failures as the user sees them. |
| [observability-checklist.md](observability-checklist.md) | The one-page checklist. |

## The three questions

Everything here exists to answer one of these, in order:

1. **Is it up?** — health checks and an external uptime monitor.
2. **Is it broken or slow, and for how many people?** — metrics and error rates.
3. **Why?** — logs correlated by request id; traces when the answer spans services.

If you cannot answer question 1 without opening a terminal, do not start on
question 3.

## The ladder

Climb it in order. Each rung is justified by a question the one below could
not answer.

| Rung | You get | Add it when |
| --- | --- | --- |
| **0. Structured logs + request id** | The ability to reconstruct one request | Day one, always |
| **1. Health endpoint + external uptime check + alert** | You find out before the user does | Before the first production deploy |
| **2. Error tracking** | Stack traces, grouped, with release and user context | Before the first production deploy |
| **3. Metrics: error rate and latency per route** | "Is this slow for everyone or just this one person" | As soon as you have real traffic |
| **4. SLOs and alerts on rates** | Alerts that mean something, and a reason not to page on one 500 | When someone is on call |
| **5. Frontend monitoring** | What the user actually experienced | When the frontend is the product |
| **6. Distributed tracing** | Which hop in a chain of services was slow | Only when a latency question spans services and logs cannot answer it |

Most products should stop at rung 5. Rung 6 is in the optional tier for a
reason ([README.md](../README.md) technology tiers): it is real operational
weight, and a modular monolith answers nearly every latency question with a
timed log line.

## Principles

1. **Instrument outcomes, not code paths.** Requests, jobs, and business
   events — not "entered function X".
2. **Alert on symptoms, not causes.** "Error rate above 2% for 5 minutes"
   pages someone; "CPU at 80%" does not.
3. **Every alert needs an action.** If the response is "look, then ignore",
   delete the alert or fix the threshold.
4. **One request id ties it all together** — logs, errors, traces, and the
   `X-Request-Id` the user can quote to support.
5. **Cardinality is the cost.** A metric labelled with a user id is not a
   metric, it is a bill.
6. **Buy this.** Self-hosting Prometheus, Grafana, Loki, and an alert manager
   is a part-time job. Use the platform's built-in monitoring plus a hosted
   error tracker until you have a reason not to.

## Related

- [00-engineering-principles/logging.md](../00-engineering-principles/logging.md)
- [17-performance/profiling.md](../17-performance/profiling.md)
- [18-devops/ci-cd.md](../18-devops/ci-cd.md)
