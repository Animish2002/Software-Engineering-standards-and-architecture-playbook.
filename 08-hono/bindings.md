# Bindings in Hono (Cloudflare)

Bindings are how a Worker reaches Cloudflare resources; they arrive as
properties of `env` (`c.env` in Hono). Declared in `wrangler.jsonc`, typed
by `wrangler types`.

```jsonc
// wrangler.jsonc
{
  "name": "app-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": { "CORS_ORIGIN": "https://app.example.com", "LOG_LEVEL": "info" },
  "kv_namespaces": [{ "binding": "CACHE", "id": "…" }],
  "r2_buckets": [{ "binding": "FILES", "bucket_name": "app-files" }],
  "d1_databases": [{ "binding": "D1", "database_name": "app", "database_id": "…" }],
  "hyperdrive": [{ "binding": "DB", "id": "…" }],
  "queues": { "producers": [{ "binding": "JOBS", "queue": "app-jobs" }], "consumers": [{ "queue": "app-jobs", "max_batch_size": 10, "max_retries": 3, "dead_letter_queue": "app-jobs-dlq" }] },
  "durable_objects": { "bindings": [{ "name": "ROOMS", "class_name": "Room" }] },
  "observability": { "enabled": true }
}
```

Secrets (`JWT_SECRET`, API keys) are **not** in `vars`: `wrangler secret
put JWT_SECRET` per environment, and `.dev.vars` locally.

## Typing

```bash
npx wrangler types          # generates worker-configuration.d.ts with interface Env
```

```ts
type AppEnv = { Bindings: Env; Variables: Variables };
const app = new Hono<AppEnv>();
app.get('/x', async (c) => { const v = await c.env.CACHE.get('key'); /* typed */ });
```

## Using bindings in services

Pass `env` (or the specific binding) into service functions; don't reach
for a global. On Workers there is no process-level singleton, so
"construct once at import" patterns from Node don't apply; construct per
request or memoise on `env` identity.

```ts
export async function getDownloadUrl(env: Env, actorId: string, fileId: string) {
  const file = await filesRepo.findForActor(getDb(env), actorId, fileId);
  if (!file) throw new NotFoundError('File', fileId);
  const obj = await env.FILES.get(file.storageKey);          // or presign via S3-compatible API for browser direct access
  // ...
}
```

## Binding cheat-sheet

| Binding | For | Consistency | Notes |
| --- | --- | --- | --- |
| **KV** | Small values read often (config, sessions, cached JSON) | Eventual (~60 s) | Not for counters or anything needing read-after-write |
| **R2** | Objects/files | Strong | S3-compatible; presign with `aws4fetch` or the S3 SDK for browser uploads |
| **D1** | SQLite-class relational data close to the edge | Strong per DB | Good for small/medium apps; use Postgres + Hyperdrive for heavier relational needs |
| **Hyperdrive** | Pooled connection to external Postgres/MySQL | As the DB | Use with `postgres`/`pg`/`mysql2` drivers |
| **Queues** | Async jobs | At-least-once | Idempotent consumers; DLQ configured |
| **Durable Objects** | Coordination, per-entity state, WebSockets | Strong, single-threaded per object | Only when you need a single point of coordination |
| **Cache API** | HTTP response cache per colo | Per-colo | Public GETs |
| **Rate Limiting** | Per-key limits at the edge | Approximate | Cheaper than doing it in code |
| **Workers AI / Vectorize** | Inference / vectors | | Optional tier |
| **Service bindings** | Worker-to-worker calls without public HTTP | | For a modular monolith of Workers |

## Related

- [09-cloudflare/bindings.md](../09-cloudflare/bindings.md)
- [database-access.md](database-access.md)
