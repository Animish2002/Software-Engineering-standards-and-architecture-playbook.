# Error handling at the process level

Application-level strategy: [02-backend/error-handling.md](../02-backend/error-handling.md).
This page is about the process.

## Unhandled rejections and uncaught exceptions

Since Node 15, an unhandled rejection crashes the process. That is correct:
the process is in an unknown state. Log and exit; the platform restarts it.

```ts
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandledRejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});
```

Do **not** swallow these to "keep the server up". A server that continues
after an unknown error can corrupt data or leak handles. Fix the source:
every promise has a `.catch` or is awaited inside a try/catch or a
framework that forwards rejections (Express 5, Hono).

## Exit codes

- `0` clean shutdown.
- `1` fatal error.
- Signals: exit after draining ([graceful-shutdown.md](graceful-shutdown.md)).

## Error objects

- Always throw `Error` (or subclasses), never strings or plain objects; stacks and `cause` depend on it.
- Wrap with context: `throw new AppError('Upload failed', 502, 'STORAGE_ERROR', { cause: err })` (Node supports `{ cause }`).
- Serialise with pino's `err` serializer (`{ err }`), which keeps `message`, `stack`, `cause`, and custom props.

## Warnings

`process.on('warning', ...)`: deprecations and `MaxListenersExceeded` show
up here. Log them; the latter is often a leak.

## Startup failures

Config validation failure, migration mismatch, or port in use should exit
non-zero **immediately** with a clear message, before listening. Half-
started processes that pass health checks are worse than crashed ones.

## Related

- [graceful-shutdown.md](graceful-shutdown.md)
- [00-engineering-principles/error-handling.md](../00-engineering-principles/error-handling.md)
