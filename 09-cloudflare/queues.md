# Cloudflare Queues

## What is it?

A message queue between Workers: a producer Worker `send()`s messages; a
consumer Worker receives them in batches, with automatic retries and a
dead-letter queue. At-least-once delivery.

## When should I use it?

- Work that must not block the response and must not be lost: emails, thumbnail generation, webhook delivery, audit fan-out.
- Smoothing bursts (accept fast, process at a controlled rate).
- Fan-out to several consumers.

## When should I NOT use it?

- Best-effort side effects where loss is acceptable: `ctx.waitUntil()` is enough.
- Work that needs an immediate result (compute inline or return 202 + poll).
- Ordering guarantees per key (Queues don't guarantee order; use a Durable Object per key if strict ordering is required).

## Configuration

```jsonc
"queues": {
  "producers": [{ "binding": "JOBS", "queue": "app-jobs" }],
  "consumers": [{ "queue": "app-jobs", "max_batch_size": 10, "max_batch_timeout": 5, "max_retries": 5, "dead_letter_queue": "app-jobs-dlq" }]
}
```

## Producer

```ts
type JobMessage = { type: 'email.welcome'; userId: string } | { type: 'thumbnail.generate'; fileId: string };

// after the write commits
await env.JOBS.send({ type: 'email.welcome', userId } satisfies JobMessage);
// or batch: await env.JOBS.sendBatch(messages.map((body) => ({ body })));
```

## Consumer

```ts
export default {
  async queue(batch: MessageBatch<JobMessage>, env: Env) {
    for (const msg of batch.messages) {
      try {
        await handle(env, jobSchema.parse(msg.body));   // validate: the producer may be an older deploy
        msg.ack();
      } catch (err) {
        log.warn({ err, type: msg.body.type, attempts: msg.attempts }, 'job failed');
        msg.retry({ delaySeconds: Math.min(600, 30 * 2 ** msg.attempts) });   // backoff
      }
    }
  },
};
```

- Ack/retry **per message**; don't let one failure retry the whole batch.
- Handlers are **idempotent** (a message may be delivered twice): upsert, overwrite, check a "done" marker.
- Payloads carry ids, not full records.
- Monitor the DLQ; alert when it grows.

## Cron Triggers

```jsonc
"triggers": { "crons": ["0 3 * * *"] }
```

```ts
async scheduled(event, env, ctx) { ctx.waitUntil(runNightlyCleanup(env)); }
```

For periodic work with no fan-out. Combine: cron enqueues a job per item;
the queue consumer processes them.

## Related

- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
- [05-apis/idempotency.md](../05-apis/idempotency.md)
