# Cloudflare bindings

Hono-side typing and config are in [08-hono/bindings.md](../08-hono/bindings.md).
This page is about choosing and using each product.

## Decision table

| Need | Use | Not |
| --- | --- | --- |
| Files, images, backups | **R2** | KV (value limits), D1 (blobs) |
| Relational data, transactions, joins | **Postgres via Hyperdrive** (or D1 for small apps) | KV |
| Read-mostly config/feature flags/session lookups tolerant of ~60 s staleness | **KV** | D1 for every read |
| Cache of computed JSON with TTL | **KV** or Cache API | Durable Object |
| Async work, retries, fan-out | **Queues** | `waitUntil` for anything that must not be lost |
| Scheduled work | **Cron Triggers** | A Worker polling |
| Per-entity coordination, counters with strong consistency, WebSocket rooms | **Durable Objects** | KV (eventual), D1 (no push) |
| Worker-to-worker calls | **Service bindings** | Public HTTP between your own Workers |
| Rate limiting | **Rate Limiting binding** or WAF rules | Counters in KV |

## R2

- S3-compatible API (`aws4fetch` in Workers, AWS SDK in Node) for presigned URLs; `env.FILES.get/put` for in-Worker access.
- Presigned PUT for browser uploads: short expiry (minutes), constrain `Content-Type` and `Content-Length` where the SDK allows, key chosen by the server (`<ownerId>/<uuid>`), never by the client.
- **CORS** is configured on the bucket (dashboard or API); allowed origins = the frontend, methods `GET, PUT`, headers `Content-Type`.
- API tokens: "Object Read & Write" scoped to one bucket (least privilege). Bucket-admin operations (CORS, lifecycle) are dashboard-only by design; don't widen the token to script them.
- Health probe: `HeadObject` on a key that never exists (404 = reachable) rather than `HeadBucket`, which an object-scoped token can't call.
- Separate bucket per environment; production may live in a separate account. Never assume dev credentials extend to prod.
- Lifecycle rules for expiring temporary objects; there is no automatic cleanup for orphaned keys, so track keys in the database.

## KV

- `get`/`put`/`delete`/`list`; values up to 25 MB; TTL per key.
- Eventually consistent across colos: a `put` may not be visible for up to ~60 s elsewhere. Fine for caches and config; wrong for anything read-after-write.
- `cacheTtl` on reads for hot keys.

## D1

- SQLite at the edge with read replication; `batch()` for atomic multi-statement writes; migrations via wrangler.
- Drizzle `dialect: 'sqlite'`. SQLite supports partial indexes, but check type differences (no `timestamptz`; store ISO strings or integer epochs; no native `uuid`).

## Hyperdrive

- Sits in front of your Postgres/MySQL, pools connections, and caches read queries optionally.
- Configure once per environment with the database URL (use the provider's public/proxy URL).
- Driver options: `max: 1`, `prepare: false`.

## Queues

See [queues.md](queues.md).

## Durable Objects

See [durable-objects.md](durable-objects.md).

## Service bindings

```jsonc
"services": [{ "binding": "AUTH", "service": "auth-worker" }]
```

`await env.AUTH.fetch(request)` or RPC methods (`WorkerEntrypoint`) with
no public exposure and no extra latency of a public hop.

## Related

- [08-hono/bindings.md](../08-hono/bindings.md)
- [security.md](security.md)
