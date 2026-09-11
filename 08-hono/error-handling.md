# Error handling in Hono

```ts
// lib/errors.ts (AppError hierarchy shared with the Express version)
import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { fail } from './response';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const log = c.get('log');
  let e: unknown = err;
  if (e instanceof ZodError) e = new ValidationError(e.flatten().fieldErrors);
  if (e instanceof HTTPException) e = new AppError(e.message || 'Request failed', e.status, 'HTTP_ERROR');   // from built-in middleware (bodyLimit, jwt)
  if (isPgError(e, '23505')) e = new ConflictError('Already exists');

  if (e instanceof AppError) {
    log[e.status >= 500 ? 'error' : 'info']({ err: e, code: e.code }, e.message);
    return c.json(fail(e.message, e.code, e.details), e.status as any);
  }
  log.error({ err: e }, 'unhandled error');
  return c.json(fail('Internal server error', 'INTERNAL'), 500);
};

export const notFound: NotFoundHandler = (c) => c.json(fail('Route not found', 'NOT_FOUND'), 404);
```

```ts
app.notFound(notFound);
app.onError(errorHandler);
```

## Rules

- Throw `AppError` subclasses from services; never build responses there.
- Hono's `HTTPException` is what its built-in middleware throws; map it, don't use it as your domain error type (it lacks `code`).
- Async handlers: thrown errors and rejections both reach `onError`.
- On Workers, unhandled errors in `waitUntil` tasks don't reach `onError`; wrap background work with its own `catch`.

## Process-level (Workers)

There is no process to crash. An uncaught error yields a 1101/500 to the
client and a log line in the dashboard/`wrangler tail`. Still log with
request ids so you can find it.

## Related

- [02-backend/error-handling.md](../02-backend/error-handling.md)
- [07-express/error-handling.md](../07-express/error-handling.md)
