# 08 — Hono

Hono is a small, typed web framework that runs on Cloudflare Workers, Node,
Bun, Deno, and others from the same code. Use it for Workers deployments
and as a lighter alternative to Express on Node. Framework-agnostic rules
are in [02-backend/](../02-backend/README.md).

| Document | Answers |
| --- | --- |
| [project-structure.md](project-structure.md) | Layout for a Hono app (Workers or Node). |
| [routing.md](routing.md) | Routers, grouping, typed params, RPC. |
| [middleware.md](middleware.md) | Built-ins, custom middleware, ordering. |
| [validation.md](validation.md) | `@hono/zod-validator`, typed inputs, OpenAPI. |
| [error-handling.md](error-handling.md) | `onError`, `HTTPException`, envelope. |
| [bindings.md](bindings.md) | Typing `env` (KV, R2, D1, Queues, Hyperdrive, secrets). |
| [database-access.md](database-access.md) | Drizzle on Workers (Hyperdrive/Neon/D1) and on Node. |
| [cloudflare-workers.md](cloudflare-workers.md) | Deploying Hono to Workers; constraints; local dev. |

## Why Hono for Workers

- Web-standard `Request`/`Response`; no Node polyfills needed.
- Typed `c.env` bindings and typed route inputs.
- Built-in `cors`, `secureHeaders`, `logger`, `jwt`, `bearerAuth`, `cache` middleware.
- RPC client (`hc`) gives the frontend end-to-end types without codegen when both live in one repo.

## Express vs Hono in one line

Express for long-lived Node services with a rich middleware need; Hono for
edge/Workers or when you want typed routes and a smaller surface. Both
follow the same layering. See [23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md).
