# Cloudflare reference architectures

## A. Static frontend + Node API (most common)

```text
browser ──► Cloudflare Pages (React/Vite SPA)
   │
   ├──► api.example.com  (Cloudflare DNS + proxy) ──► Railway/Fly/container: Node + Express ──► Postgres
   │
   └──► R2 bucket (presigned PUT/GET)  ◄── presigned by the API
```

- Cloudflare provides DNS, TLS, WAF, rate-limiting rules, caching of static assets.
- The API stays a normal Node process (pool, streams, any npm package).
- R2 CORS allows the **frontend** origin (never the API's).
- Separate buckets (and ideally accounts) per environment.

## B. All-edge: Pages + Workers + R2 + Postgres via Hyperdrive

```text
browser ──► Pages (SPA)
   └──► Worker (Hono) ──► Hyperdrive ──► Postgres
              ├──► R2 (presign or direct)
              ├──► KV (cache)
              └──► Queues ──► consumer Worker
```

- Lowest latency worldwide, pay-per-request.
- Constraints: CPU limits, no Node-only deps, per-request DB clients.
- Choose when the API is I/O-bound CRUD and you value zero idle cost.

## C. Small app entirely on Cloudflare with D1

```text
browser ──► Pages ──► Worker ──► D1 (SQLite) + R2 + KV
```

- No external database to run. D1 is fine for small/medium relational
  workloads; migrations via `wrangler d1 migrations`.
- Move to Postgres + Hyperdrive when you need Postgres features
  (partial indexes, richer types, extensions) or higher write throughput.

## D. Hybrid: Node core + Workers at the edge

Node API for the heavy parts; Workers for auth-at-edge, redirects,
webhook intake, image resizing, or public cached reads. Service bindings
or plain HTTP between them.

## Choosing

```text
Need Node-only libs, long CPU work, or already running Node fine?
  └── Yes → A (or D for edge extras)
Greenfield I/O-bound API, want zero idle cost and edge latency?
  └── Yes → B (Postgres) or C (small, D1)
```

See [23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md).

## Cross-cutting rules

- Frontend and API on the same registrable domain (`app.example.com`, `api.example.com`) so cookies are same-site.
- Secrets in Workers secrets / platform variables, never in `vars` or the repo.
- One `wrangler` environment per deployment environment; separate bindings (buckets, namespaces, databases) per environment.

## Related

- [deployment.md](deployment.md)
- [bindings.md](bindings.md)
