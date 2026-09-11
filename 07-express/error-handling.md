# Error handling in Express

Strategy: [02-backend/error-handling.md](../02-backend/error-handling.md).

## The error middleware

```ts
// middleware/error-handler.ts
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, ConflictError } from '../lib/errors.js';
import { fail } from '../lib/response.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let e: unknown = err;

  if (e instanceof ZodError) e = new ValidationError(e.flatten().fieldErrors);
  else if (isBodyParserError(e, 'entity.parse.failed')) e = new AppError('Malformed JSON body', 400, 'INVALID_JSON');
  else if (isBodyParserError(e, 'entity.too.large')) e = new AppError('Payload too large', 413, 'PAYLOAD_TOO_LARGE');
  else if (isPgError(e, '23505')) e = new ConflictError('Already exists');
  else if (isPgError(e, '23503')) e = new AppError('Referenced record not found', 400, 'INVALID_REFERENCE');

  if (e instanceof AppError) {
    req.log[e.status >= 500 ? 'error' : 'info']({ err: e, code: e.code }, e.message);
    return res.status(e.status).json(fail(e.message, e.code, e.details));
  }

  req.log.error({ err: e }, 'unhandled error');
  if (res.headersSent) return;                              // streaming response already started; nothing to do
  res.status(500).json(fail('Internal server error', 'INTERNAL'));
};
```

Four parameters are required; Express identifies error middleware by
arity. Register it last.

## Not found

```ts
export const notFound: RequestHandler = (_req, res) => res.status(404).json(fail('Route not found', 'NOT_FOUND'));
```

## Express 4 vs 5

Express 5 forwards rejected promises. Express 4 needs:

```ts
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

## Checklist

- [ ] One error middleware, last, four params.
- [ ] Zod, body-parser, and constraint errors mapped there.
- [ ] `headersSent` guard.
- [ ] 5xx logged with stack; 4xx at info.
- [ ] Not-found handler with the same envelope.

## Related

- [19-reusable-patterns/backend/http-errors.md](../19-reusable-patterns/backend/http-errors.md)
