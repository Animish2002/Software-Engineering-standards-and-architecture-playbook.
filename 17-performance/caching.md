# Caching (performance view)

Mechanics per layer are in [02-backend/caching.md](../02-backend/caching.md)
and [09-cloudflare/caching.md](../09-cloudflare/caching.md). This page is
the decision.

## Before caching

1. The query has the right index and a good plan.
2. Round trips are minimised.
3. The payload is the right size.

If it's still slow or still expensive at volume, cache.

## Where to cache, cheapest first

```text
token payload (permission keys)      no lookup at all
in-process TTL map                   one instance, small data, seconds of staleness OK
HTTP caching headers                 browser/CDN do the work for public reads
edge cache (Cloudflare)              public responses close to users
KV / Redis                           shared across instances; sessions; rate limits; hot computed reads
database materialisation             aggregates too expensive to compute per read
```

## Redis vs database vs KV

```text
Multiple instances need to share it?
  ├── No  → in-process map with TTL + max size
  └── Yes
       Is it read-after-write sensitive (counters, locks, sessions with instant revoke)?
         ├── Yes → Redis (or Postgres if volume is modest: an unlogged table works)
         └── No  → KV (Workers) / Redis / a Postgres cache table
```

Introduce Redis only when in-process memory is insufficient *and* the
database can't serve it. It's another service to run, secure, and pay
for. See [23-decision-guides/databases.md](../23-decision-guides/databases.md).

## Keys and invalidation

- Key by every input including identity for private data.
- Invalidate in the writing service; or short TTLs; prefer mark-stale + background refresh for UI-facing caches.
- Bound size; jitter TTLs on hot keys; single-flight refreshes.

## What caching hides

- A missing index (cache warms, the underlying query is still a scan when it misses).
- Authorization bugs (a cached response for user A served to user B if the key lacks identity).
- Stale writes (read-modify-write from a cached value).

## Client cache

The frontend's module-level cache with revalidation is the highest-impact
cache for perceived speed: instant "back", no skeleton flashes
([10-frontend/state-management.md](../10-frontend/state-management.md)).

## Related

- [02-backend/caching.md](../02-backend/caching.md)
- [database.md](database.md)
