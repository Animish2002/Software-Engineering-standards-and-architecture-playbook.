# Caching (backend)

## What is it?

Keeping a copy of an expensive result somewhere cheaper to read. Every cache
trades freshness for speed and adds an invalidation problem.

## Why does it matter?

Done right, caching turns a 200 ms query into a 1 ms lookup. Done wrong, it
serves stale data, leaks one user's data to another, or hides a slow query
that should have been fixed.

## When should I use it?

- After measuring: the same expensive read is served many times per invalidation.
- Data that tolerates staleness (a listing a few seconds old, a computed report, a permission set until the next refresh).
- Third-party responses with rate limits or cost.

## When should I NOT use it?

- Before indexing and fixing the query ([03-databases/query-optimization.md](../03-databases/query-optimization.md)). Most "needs a cache" problems are missing indexes.
- Per-user data with no keying discipline (cache poisoning across users).
- Anything where a stale read causes a wrong write (balances, inventory, permissions for destructive actions).

## Layers, cheapest first

| Layer | Where | Use for | Invalidation |
| --- | --- | --- | --- |
| **Token payload** | JWT claims | Permission keys, display name | Next refresh (bounded TTL) |
| **In-process memory** | `Map` with TTL, per instance | Config lookups, small reference data, rate-limit buckets on a single instance | TTL; lost on restart; not shared across instances |
| **HTTP caching** | `Cache-Control`, `ETag` | Public or per-user GET responses the browser/CDN can hold | Headers; `no-store` for private data unless `private` is set deliberately |
| **CDN / edge cache** | Cloudflare Cache API, Workers `caches.default` | Public assets and public API reads | TTL + purge on write |
| **Redis / KV** | Shared store | Sessions, rate limits across instances, hot computed reads | Explicit delete on write, or TTL |
| **Database materialisation** | Denormalised column, materialised view | Aggregates (folder sizes, counts) | On write (trigger/app) or scheduled refresh |

Introduce Redis only when in-process memory fails (multiple instances need
to share) and the database can't serve it. See
[23-decision-guides/databases.md](../23-decision-guides/databases.md).

## Recommended approach

1. Measure with `EXPLAIN ANALYZE` and request timings. Fix the query first.
2. Pick the cheapest layer that solves it.
3. Key by every input that affects the result, including the user id for private data: `items:list:${userId}:${folderId}`.
4. Invalidate on write in the same service function that writes, or use a short TTL and accept staleness. Prefer **mark stale + revalidate** over delete when the consumer is a UI (avoids a flash of empty state).
5. Bound the size (LRU or TTL) so memory can't grow without limit.

```ts
// lib/memo-cache.ts — in-process TTL cache with a size cap
export function createCache<T>({ ttlMs, max = 1000 }: { ttlMs: number; max?: number }) {
  const store = new Map<string, { value: T; expires: number }>();
  return {
    get(key: string) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expires < Date.now()) { store.delete(key); return undefined; }
      return hit.value;
    },
    set(key: string, value: T) {
      if (store.size >= max) store.delete(store.keys().next().value!);
      store.set(key, { value, expires: Date.now() + ttlMs });
    },
    delete: (key: string) => store.delete(key),
  };
}
```

## HTTP headers

```ts
// private, per-user API responses: never shared-cached
res.setHeader('Cache-Control', 'private, no-store');
// public, immutable assets (hashed filenames)
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
// public API read that may be a minute stale
res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
```

## Common mistakes

- Caching to avoid an index.
- Cache keys missing the user/tenant id.
- Caching error responses.
- Unbounded in-memory maps (a slow memory leak).
- Two sources of truth (cache written directly, database written separately).

## Production considerations

- Expose cache hit/miss counts in logs or metrics.
- Cache stampede on expiry: for hot keys, use single-flight (one refresh, others wait) or jittered TTLs.
- On Workers, the Cache API is per-colo; KV is eventually consistent (up to ~60 s). Design for it.

## Checklist

- [ ] Query and index fixed before caching.
- [ ] Cheapest sufficient layer chosen.
- [ ] Keys include every input, including identity for private data.
- [ ] Invalidation happens in the writing service.
- [ ] Size bounded; TTL set.
- [ ] `Cache-Control: private, no-store` on private responses.

## Related

- [17-performance/caching.md](../17-performance/caching.md)
- [09-cloudflare/caching.md](../09-cloudflare/caching.md)
- [10-frontend/api-integration.md](../10-frontend/api-integration.md) (client-side cache with revalidation)
