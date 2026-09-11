# Background jobs

## What is it?

Work that should not run inside the request/response cycle: sending email,
generating thumbnails, exporting reports, recalculating aggregates, retrying
webhooks, scheduled cleanups.

## Why does it matter?

Doing it inline makes requests slow and fragile (an email provider outage
fails user signup). Doing it with fire-and-forget promises loses work on
restart. A job mechanism makes the work durable and retryable.

## When should I use it?

- The side effect can be delayed by seconds without the user noticing.
- The work takes longer than ~200 ms or calls a third party.
- The work must eventually happen even if the process restarts.

## When should I NOT use it?

- The user needs the result in the response (compute it, or return a job id and poll).
- Trivial, best-effort side effects where loss is acceptable (a `void logAction()` audit write, a welcome email you're willing to lose). Log failures; don't build a queue for them.

## Options, simplest first

| Option | Use when | Notes |
| --- | --- | --- |
| **`void promise.catch(log)`** | Loss acceptable, one instance | No durability. Fine for audit rows and notifications. |
| **`setInterval` in the server** | Periodic cleanup on a single instance | Runs once per instance; guard with a DB lock if you scale out. |
| **Postgres job table** (recommended first durable option) | You already have Postgres; modest volume | `jobs(id, type, payload, run_at, attempts, locked_at)`; worker polls with `FOR UPDATE SKIP LOCKED`. Libraries: `pg-boss`, `graphile-worker`. |
| **Cloudflare Queues + Cron Triggers** | Workers deployment | Native, cheap, at-least-once; see [09-cloudflare/queues.md](../09-cloudflare/queues.md). |
| **Redis-backed (BullMQ)** | High volume, need priorities/delays/rate limits, already have Redis | Adds Redis to operate. |
| **Managed queue (SQS, etc.)** | Multiple services, cloud-native stack | Vendor lock-in; use if the rest is there. |

## Recommended approach

1. Define a job as `{ type, payload }` with a Zod schema per type.
2. Enqueue from the **service** after the transaction commits (enqueue inside the transaction only if the queue is the same database).
3. Handlers are **idempotent**: a job may run twice. Key side effects on the job id or a natural key.
4. Retry with exponential backoff; after N attempts, move to a dead-letter state and alert.
5. Run the worker as the same codebase, different entrypoint (`worker.ts`), so it shares services and config.

```ts
// jobs/types.ts
export const jobSchemas = {
  'email.welcome': z.object({ userId: z.string().uuid() }),
  'thumbnail.generate': z.object({ fileId: z.string().uuid() }),
} as const;

// jobs/handlers.ts
export const handlers = {
  'email.welcome': async ({ userId }) => { /* idempotent: check sentAt */ },
  'thumbnail.generate': async ({ fileId }) => { /* overwrite key; safe to repeat */ },
};

// worker.ts
await boss.work('email.welcome', ({ data }) => handlers['email.welcome'](jobSchemas['email.welcome'].parse(data)));
```

## Common mistakes

- Enqueueing before the transaction commits (worker runs, row doesn't exist yet).
- Non-idempotent handlers with at-least-once delivery (duplicate emails).
- Unbounded retries on permanent failures (a bad email address retried forever).
- Cron inside the API process on multiple instances without a lock (runs N times).

## Production considerations

- Graceful shutdown: stop taking new jobs, finish in-flight ones, then exit ([06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md)).
- Observe queue depth and job age; alert on dead-letter growth.
- Payloads carry ids, not full records; the handler reads fresh state.

## Checklist

- [ ] Job types have schemas; handlers are idempotent.
- [ ] Enqueue after commit.
- [ ] Backoff + dead-letter.
- [ ] Worker shares the service layer.
- [ ] Periodic jobs are single-run across instances.

## Related

- [05-apis/idempotency.md](../05-apis/idempotency.md)
- [05-apis/webhooks.md](../05-apis/webhooks.md)
