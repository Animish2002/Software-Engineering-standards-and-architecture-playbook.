# Error handling

## What is it?

A single, system-wide answer to: how is a failure represented, where is it
caught, what does the caller see, and what gets logged. Decide this before the
happy path; retrofitting is painful.

## Why does it matter?

Ad-hoc error handling produces `try/catch` in every handler, inconsistent
status codes, swallowed failures, and leaked stack traces. Centralised handling
makes every failure look the same to clients and to logs.

## Recommended approach

### 1. Distinguish expected from unexpected failures

| Kind | Examples | Representation | Response |
| --- | --- | --- | --- |
| Expected (operational) | Not found, validation failed, forbidden, conflict, rate limited | Typed `AppError` subclasses with `status` and `code` | 4xx with a stable `code` |
| Unexpected (programmer/infra) | `TypeError`, database down, unhandled rejection | Plain `Error` | 500 with a generic message; full detail logged |

### 2. Throw typed errors from services

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` ${id}` : ''} not found`, 404, 'NOT_FOUND');
  }
}
export class ValidationError extends AppError {
  constructor(details: unknown) { super('Validation failed', 400, 'VALIDATION_FAILED', details); }
}
export class UnauthorizedError extends AppError {
  constructor() { super('Authentication required', 401, 'UNAUTHORIZED'); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403, 'FORBIDDEN'); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409, 'CONFLICT'); }
}
```

### 3. Catch once, at the edge

One error middleware (Express) or `app.onError` (Hono) maps errors to the
response envelope. Handlers do not `try/catch` unless they can *recover*.

```ts
// middleware/error-handler.ts (Express 5 forwards rejected promises automatically)
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) err = new ValidationError(err.flatten());
  if (err instanceof AppError) {
    if (err.status >= 500) req.log.error({ err }, err.message);
    return res.status(err.status).json(fail(err.message, err.code, err.details));
  }
  req.log.error({ err }, 'Unhandled error');
  res.status(500).json(fail('Internal server error', 'INTERNAL'));
}
```

### 4. Never swallow

```ts
// Avoid
try { await sendEmail(user); } catch {}
// Recommended: decide explicitly. Best-effort side effect? Log it.
try { await sendEmail(user); } catch (err) { log.warn({ err, userId: user.id }, 'welcome email failed'); }
```

### 5. Frontend: errors are state, not exceptions

The API client returns a result, and components render error states
(see [10-frontend/error-and-loading-states.md](../10-frontend/error-and-loading-states.md)).

```ts
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { message: string; code?: string } };
```

Route-level error boundaries catch rendering errors; they are not a substitute
for handling API failures.

### 6. Process-level

Node: handle `unhandledRejection` and `uncaughtException` by logging and
exiting; let the process manager restart. See
[06-nodejs/error-handling.md](../06-nodejs/error-handling.md).

## Bad example

```ts
// Avoid: per-handler mapping, leaked internals, inconsistent shapes
app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) return res.status(404).send('Not found');
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.stack });
  }
});
```

## Common mistakes

- Using exceptions for control flow ("throw to skip").
- Returning `null` for "not found" from a service and then forgetting to check it. Throw `NotFoundError` from the service, or return a discriminated result; don't mix.
- Catching, logging, and re-throwing at every layer (the same error appears five times in logs).
- Exposing database error messages or stack traces to clients.
- Different error shapes from different endpoints.

## Production considerations

- Every 5xx is logged with the request id and full error; every 4xx is logged at `info`/`warn` without a stack.
- Error responses never include internals (SQL, file paths, stack).
- Alerts key on 5xx rate, not on individual log lines.
- Validation errors include field-level `details` so forms can show them inline.

## Checklist

- [ ] One `AppError` hierarchy with `status` and `code`.
- [ ] One error middleware; handlers do not map errors themselves.
- [ ] Zod errors are converted to `VALIDATION_FAILED` with field details.
- [ ] No empty `catch`.
- [ ] Unhandled rejections crash the process (and it restarts).
- [ ] Frontend renders API errors from a result type, not from thrown exceptions.

## Related

- [05-apis/error-format.md](../05-apis/error-format.md)
- [02-backend/error-handling.md](../02-backend/error-handling.md)
- [19-reusable-patterns/backend/http-errors.md](../19-reusable-patterns/backend/http-errors.md)
