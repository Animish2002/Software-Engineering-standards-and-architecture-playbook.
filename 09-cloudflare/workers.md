# Cloudflare Workers

## What is it?

JavaScript/TypeScript (or WASM) that runs in V8 isolates on Cloudflare's
edge, close to the user, with no server to manage. Each request gets a
fresh (or reused) isolate; startup is milliseconds; scaling is automatic.

## When should I use it?

- Request/response APIs and BFFs where latency to users worldwide matters.
- Low baseline cost (pay per request; zero when idle).
- Glue between Cloudflare services (R2, KV, Queues, D1).
- Webhook receivers, redirects, auth at the edge, image/URL rewriting.

## When should I NOT use it?

- Long-running CPU work (transcoding, PDF generation at scale). Use a Node worker or a container.
- Code depending on Node-only libraries with no Web-standard equivalent (native modules, `fs`, some database drivers). `nodejs_compat` covers a lot, not everything.
- Persistent connections/state per process (in-memory caches across requests, WebSocket fan-out without Durable Objects).
- Uploads that must be proxied through the server (use presigned R2 URLs instead; if you must proxy, mind the request body limits).
- Teams unfamiliar with the constraints and with an existing, working Node deployment. Moving is a cost; do it for a reason.

## Limits to know (check the docs for current numbers)

| Limit | Typical (paid plan) |
| --- | --- |
| CPU time per request | Configurable up to tens of seconds on paid; default small; I/O wait doesn't count |
| Memory | 128 MB per isolate |
| Request body | Depends on plan (100 MB-500 MB) |
| Subrequests | Hundreds per request |
| Script size | Several MB compressed |
| Simultaneous outgoing connections | Limited per request (single digits); batch and reuse |

Reference: https://developers.cloudflare.com/workers/platform/limits/

## Programming model

```ts
export default {
  async fetch(request, env, ctx) { /* HTTP */ },
  async scheduled(event, env, ctx) { /* Cron Trigger */ },
  async queue(batch, env, ctx) { /* Queue consumer */ },
} satisfies ExportedHandler<Env>;
```

- `env`: bindings and vars.
- `ctx.waitUntil(p)`: keep the isolate alive for background work after the response.
- Module-level state persists only within an isolate's lifetime and is not shared; treat as a best-effort cache.

## Hono on Workers

See [08-hono/cloudflare-workers.md](../08-hono/cloudflare-workers.md) for
the app-level consequences.

## Related

- [architecture.md](architecture.md)
- [23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md)
