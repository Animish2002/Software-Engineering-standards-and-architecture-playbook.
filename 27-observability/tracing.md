# Distributed tracing

## What is it?

Following one request across every service, database call, and outbound HTTP
request it touches, as a timeline of nested spans.

## Why does it matter?

When a request takes 3 seconds and crosses four services, logs tell you each
hop's total time but not where the time went inside it. A trace shows the
waterfall — including the three sequential queries that should have been one.

## When should I NOT use it?

**Most of the time, on this stack.** Tracing is in the optional tier
([README.md](../README.md)). Do not add it until you can name a question it
answers that logs cannot:

| Question | Needs tracing? |
| --- | --- |
| Which endpoint is slow? | No — metrics |
| Which query is slow? | No — `pg_stat_statements` and slow query log |
| Why did this one request fail? | No — logs by request id |
| Is this endpoint slow for everyone or one tenant? | No — metrics |
| Which of five services in this chain added the latency? | **Yes** |
| Why is p99 10× p50 when every individual component looks fine? | **Yes** |

A modular monolith ([01-project-architecture/](../01-project-architecture/))
has one hop. A timed log line at each layer answers nearly everything, for
none of the operational cost.

The prerequisite is non-negotiable: **structured logs with a request id
first**. Tracing added before that is a second incomplete system.

## The cheap version first

Before adopting OpenTelemetry, try timing the phases you suspect:

```ts
const timings: Record<string, number> = {};
const time = async <T>(name: string, fn: () => Promise<T>) => {
  const start = performance.now();
  try { return await fn(); } finally { timings[name] = Math.round(performance.now() - start); }
};

const user = await time('db.user', () => usersRepo.findById(id));
const files = await time('db.files', () => filesRepo.listForUser(id));
const quota = await time('storage.quota', () => storage.usage(id));

req.log.info({ timings }, 'request.timings');
```

One log line, per-phase durations, greppable and aggregatable. This answers
the "which part of this endpoint is slow" question completely, and it is
twelve lines rather than a new subsystem.

## If you do adopt it

```ts
// observability/tracing.ts — loaded with --import, before the app
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

new NodeSDK({
  serviceName: config.SERVICE_NAME,
  traceExporter: new OTLPTraceExporter({ url: config.OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },      // noisy and rarely useful
  })],
}).start();
```

Auto-instrumentation covers HTTP, `pg`, and most clients without touching
application code. That is most of the value; add manual spans only where a
meaningful unit of work is invisible.

```ts
// A manual span for a business operation worth seeing in the waterfall
await tracer.startActiveSpan('invoice.generate', async (span) => {
  span.setAttribute('invoice.line_count', lines.length);
  try {
    return await generate(lines);
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  } finally {
    span.end();                             // in `finally`, always
  }
});
```

### Tie traces to logs

```ts
const span = trace.getActiveSpan()?.spanContext();
req.log = logger.child({ reqId: req.id, traceId: span?.traceId });
```

Without this, traces and logs are two systems describing the same event with
no way to get from one to the other — which is the most common reason a
tracing rollout is abandoned.

### Sampling

100% sampling in production is expensive and mostly redundant. Head sampling
at 1–10% plus a rule that always keeps errors and slow requests gives you the
interesting traces at a fraction of the volume.

### Context propagation

Traces break at every boundary that drops the `traceparent` header: your own
`fetch` calls, queue messages, and scheduled jobs. Auto-instrumentation
handles outbound HTTP; for queues you must put `traceparent` in the message
payload and restore it in the worker. A trace that stops at the queue is the
usual disappointment.

## Common mistakes

- Adopting tracing before structured logging, then having two half-instrumented systems.
- Manual spans around every function, producing waterfalls too deep to read.
- Forgetting `span.end()` outside a `finally`, leaking spans on the error path.
- No `traceId` in logs.
- 100% sampling, then a surprising bill.
- Attributes containing PII or secrets — spans are exported to a third party, so scrub them like error events.
- Losing context across queues and cron jobs.

## Production considerations

- The collector is another service to run. Prefer a hosted OTLP endpoint (Grafana Cloud, Honeycomb, Dash0, or your APM) over self-hosting one early.
- Workers and edge runtimes need their own approach; the Node SDK does not apply.
- The SDK adds measurable overhead. Measure it before and after on a latency-sensitive service.
- Budget the cost per span volume before rollout, not after the first invoice.

## Checklist

- [ ] Structured logging with request ids exists and is used.
- [ ] A specific question has been written down that tracing will answer.
- [ ] Auto-instrumentation first; manual spans only for meaningful units of work.
- [ ] `traceId` on every log line.
- [ ] Sampling configured; errors and slow requests always kept.
- [ ] Context propagated across queues and jobs.
- [ ] No PII or secrets in span attributes.

## Related

- [metrics.md](metrics.md)
- [00-engineering-principles/logging.md](../00-engineering-principles/logging.md)
- [17-performance/profiling.md](../17-performance/profiling.md)
