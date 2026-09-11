# Backend patterns

| File | Purpose |
| --- | --- |
| [http-errors.md](http-errors.md) | `AppError` hierarchy + error middleware (Express) / `onError` (Hono) |
| [response-envelope.md](response-envelope.md) | `ok()` / `fail()` |
| [async-handler.md](async-handler.md) | Express 4 async wrapper (not needed on 5) |
| [pagination.md](pagination.md) | Parse offset/cursor params once; encode/decode cursors |
| [env-config.md](env-config.md) | Zod-validated config module |
| [request-context.md](request-context.md) | Request id + child logger + request log line |
| [require-permission.md](require-permission.md) | `authenticate` + `requirePermission` middleware |
