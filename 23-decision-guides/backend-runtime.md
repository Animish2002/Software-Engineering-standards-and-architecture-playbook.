# Express vs Hono vs Cloudflare Workers

## Two independent decisions

This is really two questions: **which framework** (Express vs Hono), and
**which runtime** (Node vs Workers). Hono runs on both; Express is
Node-only.

## Runtime: Node vs Cloudflare Workers

```text
Does the app need any of: long-lived connections, heavy CPU work per
request, large file bodies through the server, native Node modules,
or an existing working Node deployment?
  │
  ├── Yes ─────────────────────────────────────────► Node.js
  │                                                    (Express or Hono; see below)
  │
  └── No — it's I/O-bound request/response CRUD, and you want
      edge latency + near-zero idle cost + Cloudflare bindings
       │
       ├── Yes ─────────────────────────────────────► Cloudflare Workers (Hono)
       └── Not sure / no strong reason either way ───► Node.js — the safer, more flexible default
```

| | Node.js | Cloudflare Workers |
| --- | --- | --- |
| Cold start | N/A (long-lived process) | ~0ms (V8 isolate, not a container) |
| Idle cost | Pay for the running instance | Pay per request; ~free at low volume |
| CPU limit per request | None (process-level) | Bounded (see [09-cloudflare/workers.md](../09-cloudflare/workers.md#limits-to-know)) |
| Full Node API / npm ecosystem | Yes | Partial (`nodejs_compat` covers a lot, not everything) |
| Database connections | Pooled, long-lived | Need Hyperdrive/D1/HTTP-based driver |
| Global edge latency | One region unless you add more | Automatic, every request near the user |
| Background/scheduled work | `cluster`/cron/queue library of your choice | Cron Triggers + Queues, built in |
| Ops burden | You manage the process/container | Cloudflare manages it |

## Framework: Express vs Hono

```text
Deploying to Cloudflare Workers? ──► Hono (Express doesn't run there)
Deploying to Node?
  │
  ├── Team already knows Express well, or needs a specific
  │   Express-only middleware/ecosystem package ─────────► Express
  │
  └── Greenfield, want typed routes, smaller surface,
      or might move to Workers/Bun later ──────────────────► Hono (on @hono/node-server)
```

| | Express 5 | Hono |
| --- | --- | --- |
| Maturity / ecosystem | Very large, battle-tested | Smaller but growing fast; covers the essentials |
| Request/response types | `Request`/`Response` (Node-specific) | Web-standard `Request`/`Response` everywhere |
| Typed routes | No built-in; add manually | Built-in via `zValidator`/`app.openapi` |
| RPC client for a first-party frontend | No | `hc<AppType>()` — end-to-end types, no codegen |
| Runs on Workers | No | Yes |
| Middleware you're likely to want | `helmet`, `cors`, `express-rate-limit`, etc. — all mature | `hono/cors`, `hono/secure-headers`, etc. — built in, less third-party sprawl |

**Neither choice is wrong for a Node API.** The layering rules in this
playbook (controllers/services/repositories, one error handler, one
response envelope) are identical either way — see
[07-express/README.md](../07-express/README.md) and
[08-hono/README.md](../08-hono/README.md).

## Related

- [../09-cloudflare/architecture.md](../09-cloudflare/architecture.md)
- [../01-project-architecture/choosing-an-architecture.md](../01-project-architecture/choosing-an-architecture.md)
