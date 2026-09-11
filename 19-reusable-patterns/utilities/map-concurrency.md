# Bounded concurrency

```ts
// lib/map-concurrency.ts
export type Settled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/** Like Promise.all(items.map(fn)) but at most `limit` in flight. Rejects on first failure. */
export async function mapConcurrent<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i]!, i); }
  });
  await Promise.all(workers);
  return results;
}

/** Same, but never rejects; each result reports success or failure. */
export async function mapConcurrentSettled<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<Settled<R>[]> {
  return mapConcurrent(items, limit, async (item, i) => {
    try { return { ok: true as const, value: await fn(item, i) }; }
    catch (error) { return { ok: false as const, error }; }
  });
}
```

```ts
// upload 500 files, 6 at a time, keep going on failures
const results = await mapConcurrentSettled(files, 6, (f) => uploadOne(f));
const failed = results.map((r, i) => (r.ok ? null : files[i])).filter(Boolean);
```

Use for uploads, per-recipient share emails, batch presigning, and any
fan-out to a rate-limited service.
