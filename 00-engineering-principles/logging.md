# Logging

## What is it?

Structured, levelled records of what the system did, written for a machine to
index and a human to search during an incident.

## Why does it matter?

At 3 a.m. the only evidence is the logs. `console.log('here')` and
`console.log(user)` are useless (and the second one may be a data leak).

## Recommended approach

- **Structured JSON**, one object per line. Use `pino` on Node (fast, JSON by default) and `console.log(JSON.stringify(...))` or the platform logger on Workers.
- **Levels**: `error` (needs attention), `warn` (degraded but handled), `info` (business events, request summaries), `debug` (development only).
- **One request id** per request, attached to every log line for that request and returned in the `X-Request-Id` response header.
- **Log events, not steps**: "user.created", "upload.completed", "payment.failed", each with the ids needed to find the records.
- **Never log**: passwords, tokens, cookies, `Authorization` headers, full request bodies, personal data beyond an id or email where necessary, card numbers.

```ts
// lib/logger.ts
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  ...(process.env.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty' } }),
});
```

```ts
// per-request child logger (Express middleware)
app.use((req, res, next) => {
  req.id = req.get('X-Request-Id') ?? crypto.randomUUID();
  req.log = logger.child({ reqId: req.id });
  res.setHeader('X-Request-Id', req.id);
  const start = Date.now();
  res.on('finish', () => req.log.info({ method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start }, 'request'));
  next();
});
```

```ts
// in a service: event + ids, not prose
req.log.info({ userId, folderId, bytes }, 'upload.completed');
```

## Bad example

```ts
console.log('uploading file for ' + user.email + ' with token ' + token);
console.log(JSON.stringify(req.body));
```

## What to log where

| Layer | Log |
| --- | --- |
| Request middleware | One summary line per request (method, path, status, duration, reqId, userId) |
| Services | Business events at `info`; recoverable failures at `warn` |
| Error middleware | Every 5xx at `error` with the error object; 4xx at `info` |
| Startup | Config summary (non-secret), migrations status, listening port |
| Shutdown | Signal received, drain complete |

## Production considerations

- Write to stdout/stderr; the platform (Railway, Docker, Kubernetes, Workers) collects it. Don't write log files from the app.
- Set `LOG_LEVEL=info` in production, `debug` only temporarily.
- Sample or aggregate very high-volume `info` lines (health checks should not be logged at all).
- Ship logs somewhere searchable if the platform's viewer is not enough. Only add OpenTelemetry tracing when a concrete latency question can't be answered from logs (optional tier).

## Checklist

- [ ] JSON logs via a real logger; no bare `console.log` in application code.
- [ ] Request id on every line and in the response header.
- [ ] Redaction list covers auth headers, cookies, passwords, tokens.
- [ ] Health-check requests are excluded from request logs.
- [ ] Levels are meaningful; `error` means someone should look.

## Related

- [error-handling.md](error-handling.md)
- [06-nodejs/logging.md](../06-nodejs/logging.md)
- [05-apis/observability.md](../05-apis/observability.md)
- [27-observability/README.md](../27-observability/README.md) (metrics, alerting, dashboards — everything after logs)
