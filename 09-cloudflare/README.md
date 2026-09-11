# 09 — Cloudflare

Cloudflare as a deployment platform: Workers for APIs, Pages for static
frontends, R2 for object storage, plus KV, D1, Queues, Durable Objects, and
the edge network in front of everything. The Hono-specific side is in
[08-hono/](../08-hono/README.md).

| Document | Answers |
| --- | --- |
| [workers.md](workers.md) | What a Worker is, limits, when to use one, when to use Node instead. |
| [architecture.md](architecture.md) | Reference architectures: Pages + Workers + R2 + Postgres; when D1 fits. |
| [bindings.md](bindings.md) | KV, R2, D1, Hyperdrive, Queues, DO, service bindings; choosing between them. |
| [environment-variables.md](environment-variables.md) | `vars` vs secrets, environments, `.dev.vars`, validation. |
| [caching.md](caching.md) | Cache API, KV as cache, `Cache-Control` at the edge, purging. |
| [durable-objects.md](durable-objects.md) | When you actually need one. |
| [queues.md](queues.md) | Producers, consumers, batching, retries, DLQ. |
| [security.md](security.md) | WAF, rate limiting rules, Turnstile, Access, secrets, R2 tokens. |
| [deployment.md](deployment.md) | Wrangler, environments, Pages, CI, rollbacks. |

## Where Cloudflare fits with the rest of this playbook

| Component | Typical placement |
| --- | --- |
| React + Vite frontend | Cloudflare Pages (static; SPA fallback) |
| API | Workers + Hono (edge), **or** Node + Express on Railway with Cloudflare DNS/proxy in front |
| Files | R2, accessed by the browser via presigned URLs; CORS on the bucket points at the frontend origin |
| Relational data | Postgres (Railway/Neon) via Hyperdrive from Workers; direct pool from Node |
| Jobs | Queues + Cron Triggers (Workers) or a Postgres job table (Node) |
| Bot protection | Turnstile on login/signup |
| Edge protection | WAF managed rules, rate-limiting rules |

## Core / supporting / optional

- **Core**: Pages, Workers, R2, DNS/proxy.
- **Supporting**: Hyperdrive, Queues, Cron Triggers, Turnstile, KV (as cache).
- **Optional**: D1, Durable Objects, Workers AI, Vectorize, Access (Zero Trust).
