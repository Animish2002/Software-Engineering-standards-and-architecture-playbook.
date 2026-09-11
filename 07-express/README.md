# 07 — Express

Express 5 as the HTTP layer for a Node.js backend. Framework-agnostic
structure and rules are in [02-backend/](../02-backend/README.md); this
section is the Express implementation of them.

| Document | Answers |
| --- | --- |
| [project-structure.md](project-structure.md) | Files and `app.ts`/`server.ts` wiring. |
| [middleware.md](middleware.md) | Order, scope, writing your own. |
| [controllers.md](controllers.md) | Handler shape, async, parsing, responding. |
| [services.md](services.md) | Business logic independent of Express. |
| [repositories.md](repositories.md) | Query modules (Drizzle). |
| [validation.md](validation.md) | Zod at the edge. |
| [error-handling.md](error-handling.md) | The single error middleware. |
| [security.md](security.md) | helmet, CORS, rate limits, trust proxy, cookies. |
| [production-structure.md](production-structure.md) | Router mounting rules, health, shutdown, build. |

## Express 5 notes

- Async handlers that reject are forwarded to error middleware automatically; no `asyncHandler` wrapper needed (keep one only if you support Express 4).
- `req.query` is a getter returning a parsed object (`qs` by default); treat values as `string | string[] | undefined` and validate.
- Path syntax changed (`path-to-regexp` v8): no `*` wildcard alone; use `/{*path}` or named params. Optional segments use `{/:id}`.
- `res.status(404).json(...)` unchanged; `res.send` with a number is gone (`res.sendStatus`).

## When Express, when Hono

Express: mature middleware ecosystem, long-lived Node processes, teams that
know it. Hono: Workers/edge or Node, smaller, typed routing, built-in
validators and RPC. See [23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md).
