# Metrics

## What is it?

Numbers aggregated over time: how many requests, how long they took, how many
failed. A log line describes one event; a metric describes all of them.

## Why does it matter?

Logs answer "what happened to this request". They are bad at "is this normal"
— counting error lines over a time window is slow, expensive, and breaks the
moment log volume grows. Metrics answer questions about *rates* in constant
time, which is what alerting needs.

## When should I NOT use it?

Do not add a metrics stack before you have structured logs and an error
tracker. And if your platform already exposes request rate, error rate, and
latency (Railway, Cloudflare, Vercel, most managed hosts do), start there —
that covers rung 3 with no code.

## What to measure

**RED**, for anything that serves requests:

| Metric | Type | Why |
| --- | --- | --- |
| **R**ate | counter | Traffic. Context for everything else, and a drop to zero is its own alert. |
| **E**rrors | counter | The 5xx rate is the single most important number you have. |
| **D**uration | histogram | p95/p99, not the mean. The mean hides the tail where users actually live. |

**USE**, for resources (pools, queues, CPU):

| Metric | Why |
| --- | --- |
| **U**tilisation | How busy — DB pool in use, CPU |
| **S**aturation | Queued and waiting — pool wait time, queue depth. This is the leading indicator. |
| **E**rrors | Connection failures, timeouts |

**Business events**, which nobody regrets adding: signups, logins by result,
uploads by outcome, payments, jobs by type and result.

## Recommended approach

```ts
// observability/metrics.ts
import client from 'prom-client';

client.collectDefaultMetrics();                     // event loop lag, heap, GC, handles

export const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
});

export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 10],   // tuned to your actual latencies
});

export const dbPoolWaiting = new client.Gauge({
  name: 'db_pool_waiting',
  help: 'Requests queued for a database connection',
  collect() { this.set(pool.waitingCount); },        // pulled at scrape time
});
```

```ts
// The route pattern, never the URL
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ?? 'unmatched';    // '/users/:id', not '/users/9f2c…'
    const labels = { method: req.method, route, status: String(res.statusCode) };
    end(labels);
    httpRequests.inc(labels);
  });
  next();
});
```

```ts
// Privileged, never public — it describes your internals
app.get('/metrics', requireInternalAccess, async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

`req.route?.path` is the important line. `/users/9f2c…` as a label value
creates a new time series per user.

## Cardinality

Cardinality is the number of distinct label combinations, and cost scales
with it directly.

| Label | Verdict |
| --- | --- |
| `method`, `status`, `route` pattern, `job_type`, `provider` | Fine — bounded, small |
| `user_id`, `file_id`, `request_id`, raw path, full error message | **Never.** Unbounded. |
| `tenant_id` | Only with few tenants and a real reason. It multiplies every series. |

```ts
// Avoid — one time series per user, forever
httpRequests.inc({ route: req.path, user: req.user.id, status });
```

The failure is not gradual. A metrics backend that was comfortable at 10,000
series falls over at 10 million, and the fix is to delete the data.

Per-request identifiers belong in logs, which are built for high cardinality.
That is the division of labour between the two.

## Histograms and percentiles

Use a histogram, not a summary, so percentiles can be computed across
instances. Set buckets around the latencies you actually have — the default
buckets are wrong for most APIs, and a histogram whose buckets are all in the
wrong range gives you no usable percentile at all.

Alert on p95 or p99. A mean of 200 ms is consistent with 95% of users at
50 ms and 5% at 3 seconds.

## What to scrape and how

| Deployment | Approach |
| --- | --- |
| Managed platform with built-in metrics | Use theirs first. Add `prom-client` when you need business metrics they cannot see. |
| Kubernetes | `ServiceMonitor` scraping `/metrics` ([14-kubernetes/](../14-kubernetes/)) |
| Single container / VM | Hosted Prometheus (Grafana Cloud) scraping the endpoint, or push if it is not reachable |
| Cloudflare Workers | `prom-client` does not apply. Use Workers Analytics Engine, or emit structured logs and aggregate. |

Multiple instances each hold their own counters, so aggregate at query time.
An in-process counter is also reset by every deploy — which is why you graph
`rate()` rather than the raw total.

## Common mistakes

- Unbounded label values — the one mistake here that is expensive to undo.
- Labelling with the raw path instead of the route pattern.
- `/metrics` exposed publicly.
- Alerting on the mean.
- Default histogram buckets, so every request lands in one bucket.
- Metrics for things logs already answer better, adding cost and no capability.
- Instrumenting functions instead of outcomes, producing hundreds of series nobody graphs.

## Production considerations

- Scrape interval 15–60 s. Anything faster rarely changes a decision.
- Exclude health checks from request metrics, or they dominate the rate.
- `collectDefaultMetrics()` gives you event loop lag, which is the clearest single signal that a Node process is in trouble ([06-nodejs/event-loop.md](../06-nodejs/event-loop.md)).
- Retention: 15 days at full resolution is plenty for operations; downsample for capacity planning.
- Emit metrics from workers too — job duration, failures, and queue depth ([02-backend/background-jobs.md](../02-backend/background-jobs.md)).

## Checklist

- [ ] Request rate, error rate, and duration histogram per route pattern.
- [ ] Default Node metrics collected (event loop lag, heap).
- [ ] DB pool utilisation and wait count.
- [ ] Job duration, failures, and queue depth.
- [ ] A few business counters (signup, login, upload, payment) by result.
- [ ] No unbounded label values.
- [ ] Histogram buckets match real latencies.
- [ ] `/metrics` is privileged.
- [ ] Health checks excluded.

## Related

- [alerting-and-slos.md](alerting-and-slos.md)
- [dashboards.md](dashboards.md)
- [17-performance/profiling.md](../17-performance/profiling.md)
