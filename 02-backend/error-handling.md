# Error handling (backend)

The system-wide strategy is in
[00-engineering-principles/error-handling.md](../00-engineering-principles/error-handling.md).
This page is the backend implementation.

## Pieces

| Piece | File | Job |
| --- | --- | --- |
| Error classes | `lib/errors.ts` | `AppError(status, code)` + subclasses |
| Envelope helper | `lib/response.ts` | `fail(message, code, details)` |
| Error middleware | `middleware/error-handler.ts` | Map any thrown value to a response, log appropriately |
| Not-found handler | `middleware/not-found.ts` | 404 for unmatched routes, same envelope |
| Process handlers | `server.ts` | `unhandledRejection`/`uncaughtException` → log + exit |

## Mapping table

| Thrown | Status | Code | Logged at |
| --- | --- | --- | --- |
| `ZodError` | 400 | `VALIDATION_FAILED` (with `details`) | info |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | info |
| `ForbiddenError` | 403 | `FORBIDDEN` | warn |
| `NotFoundError` | 404 | `NOT_FOUND` | info |
| `ConflictError` | 409 | `CONFLICT` | info |
| `RateLimitedError` | 429 | `RATE_LIMITED` | warn |
| Postgres unique violation (`23505`) | 409 | `CONFLICT` | info (map in one place) |
| Postgres FK violation (`23503`) | 400 or 409 | `INVALID_REFERENCE` | info |
| `SyntaxError` from body parser | 400 | `INVALID_JSON` | info |
| Anything else | 500 | `INTERNAL` | error, with stack |

## Express 5 handler

```ts
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { fail } from '../lib/response';

export function errorHandler(err: unknown, req, res, _next) {
  let e = err;
  if (e instanceof ZodError) e = new ValidationError(e.flatten().fieldErrors);
  if (isPgError(e) && e.code === '23505') e = new ConflictError('Already exists');
  if (e instanceof AppError) {
    req.log[e.status >= 500 ? 'error' : 'info']({ err: e, code: e.code }, e.message);
    return res.status(e.status).json(fail(e.message, e.code, e.details));
  }
  req.log.error({ err: e }, 'Unhandled error');
  res.status(500).json(fail('Internal server error', 'INTERNAL'));
}
```

Express 5 forwards rejected promises from async handlers to this middleware
automatically. On Express 4, wrap handlers with an `asyncHandler`
([19-reusable-patterns/backend/async-handler.md](../19-reusable-patterns/backend/async-handler.md)).

Hono: `app.onError((err, c) => ...)` with the same mapping; see
[08-hono/error-handling.md](../08-hono/error-handling.md).

## Where errors are thrown

- Services throw domain errors. Repositories return `undefined`/empty and let the service decide.
- Controllers throw nothing of their own except via schema parsing.
- Middleware calls `next(err)` (Express) or throws (Hono).

## Best-effort side effects

Email, notifications, audit rows: wrap individually, log on failure, never
fail the main operation. Prefer a job queue when the side effect must
eventually happen ([background-jobs.md](background-jobs.md)).

```ts
void sendWelcomeEmail(user).catch((err) => log.warn({ err, userId: user.id }, 'welcome email failed'));
```

## Checklist

- [ ] All error classes in `lib/errors.ts`.
- [ ] One error middleware; one not-found handler; same envelope.
- [ ] Database constraint violations mapped in the middleware, not per handler.
- [ ] 5xx logged with stack and request id; 4xx without stack.
- [ ] Best-effort side effects never fail the request.
- [ ] Process-level handlers exit on unrecoverable errors.

## Related

- [05-apis/error-format.md](../05-apis/error-format.md)
- [06-nodejs/error-handling.md](../06-nodejs/error-handling.md)
