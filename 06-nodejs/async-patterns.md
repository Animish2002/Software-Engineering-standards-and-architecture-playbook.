# Async patterns in Node.js

## Sequential vs concurrent

```ts
// Avoid: sequential when independent (3 round trips in series)
const items = await listItems(); const crumbs = await getCrumbs(); const sizes = await getSizes();

// Recommended: concurrent
const [items, crumbs, sizes] = await Promise.all([listItems(), getCrumbs(), getSizes()]);
```

`Promise.all` rejects on the first failure. Use `Promise.allSettled` when
each result should be reported independently (sending five share emails
and telling the user which failed).

## Bounded concurrency

`Promise.all` over 5,000 uploads opens 5,000 connections. Limit it:

```ts
import pLimit from 'p-limit';
const limit = pLimit(8);
await Promise.all(files.map((f) => limit(() => uploadOne(f))));
```

Or without a dependency:

```ts
export async function mapWithConcurrency<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i]!); }
  }));
  return results;
}
```

## Timeouts and cancellation

Every outbound call has a timeout.

```ts
const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
```

Propagate `AbortSignal` into your own async functions when the caller
might go away (client disconnected: `req.on('close')` / `c.req.raw.signal`).

## Timers

```ts
import { setTimeout as sleep, setImmediate as yieldLoop } from 'node:timers/promises';
await sleep(200);
await yieldLoop();          // let I/O run inside a long loop
```

`setInterval` in a server: `.unref()` so it doesn't keep the process alive
during shutdown, and guard against overlapping runs.

## Retry with backoff

```ts
export async function retry<T>(fn: () => Promise<T>, { attempts = 3, baseMs = 100, retryOn = () => true } = {}) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === attempts || !retryOn(err)) throw err;
      await sleep(baseMs * 2 ** (i - 1) + Math.random() * baseMs);
    }
  }
}
```

Retry only idempotent operations and only transient errors (network,
5xx, 429, serialization failures). Never retry a 400.

## Fire-and-forget, done right

```ts
void sendEmail(user).catch((err) => log.warn({ err, userId: user.id }, 'email failed'));
```

Always attach a `.catch`; an unhandled rejection crashes the process (by
design). Prefer a job queue when the work must eventually happen.

## Async iteration

```ts
for await (const chunk of stream) { /* backpressure-aware */ }
for await (const row of cursorQuery) { /* large result sets without loading all */ }
```

## Don't

- `async` functions that never `await` (misleading; use plain functions).
- `new Promise(async (resolve) => ...)` (errors inside are lost).
- `await` inside `forEach` (it doesn't wait). Use `for...of` or `Promise.all(map)`.
- Mixing callbacks and promises; wrap callbacks once with `util.promisify`.

## Related

- [event-loop.md](event-loop.md)
- [22-javascript/async.md](../22-javascript/async.md)
