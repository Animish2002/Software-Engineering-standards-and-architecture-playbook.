# Caching on Cloudflare

## Layers

| Layer | Scope | Controls | Use |
| --- | --- | --- | --- |
| **Edge cache (proxy)** | Per colo, automatic for static assets | `Cache-Control` headers from the origin; Cache Rules | Pages assets, public files, public API GETs |
| **Cache API in a Worker** | Per colo | `caches.default.match/put` with a `Request` key | Programmatic caching of computed public responses |
| **KV** | Global, eventual | `put` with `expirationTtl` | Computed JSON, config, session-lookup caches |
| **Hyperdrive query cache** | Global | Enabled per Hyperdrive config | Cacheable read queries |
| **Browser** | Per user | `Cache-Control`, `ETag` | Immutable hashed assets |

## Static assets (Pages)

Vite emits hashed filenames; Pages serves them with long cache headers
automatically. `index.html` is short-lived. Nothing to configure for the
common case.

## Public API responses in a Worker

```ts
import { cache } from 'hono/cache';
app.get('/api/public/plans', cache({ cacheName: 'public', cacheControl: 'public, max-age=300, stale-while-revalidate=600' }), handler);
```

Key by URL; never cache responses that vary by user without `Vary` or a
user-specific key. Authenticated responses: `Cache-Control: private, no-store`.

## KV as a cache

```ts
const key = `folder-sizes:${ownerId}`;
const hit = await env.CACHE.get(key, 'json');
if (hit) return hit;
const sizes = await computeSizes(db, ownerId);
c.executionCtx.waitUntil(env.CACHE.put(key, JSON.stringify(sizes), { expirationTtl: 60 }));
return sizes;
```

- Write in `waitUntil` so the response isn't delayed.
- Short TTLs; accept eventual consistency; invalidate by key on write when possible (still up to 60 s across colos).

## Purging

- Pages/static: automatic on deploy.
- Cache API: `caches.default.delete(request)` per colo only; use short TTLs for anything that changes.
- Proxy cache in front of a Node API: purge via the Cloudflare API on write, or don't cache dynamic responses at the edge at all (default: dynamic content isn't cached unless you tell it to).

## Don't

- Cache authenticated or per-user responses at the edge.
- Use KV for counters or read-after-write state.
- Cache error responses.

## Related

- [02-backend/caching.md](../02-backend/caching.md)
- [17-performance/caching.md](../17-performance/caching.md)
