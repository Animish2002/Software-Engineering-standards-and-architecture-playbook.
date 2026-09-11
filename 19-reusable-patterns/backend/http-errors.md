# HTTP errors

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = 'Validation failed') { super(message, 400, 'VALIDATION_FAILED', details); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') { super(message, 401, code); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403, 'FORBIDDEN'); }
}
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string) { super(`${resource}${id ? ` ${id}` : ''} not found`, 404, 'NOT_FOUND'); }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details?: unknown) { super(message, 409, code, details); }
}
export class RateLimitedError extends AppError {
  constructor(retryAfterSeconds: number) { super('Too many requests', 429, 'RATE_LIMITED', { retryAfterSeconds }); }
}
export class PayloadTooLargeError extends AppError {
  constructor() { super('Payload too large', 413, 'PAYLOAD_TOO_LARGE'); }
}

export const isPgError = (e: unknown, code?: string): e is { code: string; constraint?: string } =>
  typeof e === 'object' && e !== null && 'code' in e && typeof (e as any).code === 'string' && (!code || (e as any).code === code);
```

```ts
// middleware/error-handler.ts (Express 5)
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, ConflictError, PayloadTooLargeError, isPgError } from '../lib/errors.js';
import { fail } from '../lib/response.js';

const normalize = (err: unknown): AppError | undefined => {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) return new ValidationError(err.flatten().fieldErrors);
  if (typeof err === 'object' && err !== null && (err as any).type === 'entity.parse.failed') return new AppError('Malformed JSON body', 400, 'INVALID_JSON');
  if (typeof err === 'object' && err !== null && (err as any).type === 'entity.too.large') return new PayloadTooLargeError();
  if (isPgError(err, '23505')) return new ConflictError('Already exists', 'CONFLICT', { constraint: err.constraint });
  if (isPgError(err, '23503')) return new AppError('Referenced record not found', 400, 'INVALID_REFERENCE');
  if (isPgError(err, '23514')) return new ValidationError({ constraint: err.constraint });
  return undefined;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const e = normalize(err);
  if (e) {
    req.log[e.status >= 500 ? 'error' : 'info']({ err: e, code: e.code }, e.message);
    if (e.status === 429 && (e.details as any)?.retryAfterSeconds) res.setHeader('Retry-After', String((e.details as any).retryAfterSeconds));
    return res.status(e.status).json(fail(e.message, e.code, e.details));
  }
  req.log.error({ err }, 'unhandled error');
  if (res.headersSent) return;
  res.status(500).json(fail('Internal server error', 'INTERNAL'));
};

export const notFound: RequestHandler = (_req, res) => res.status(404).json(fail('Route not found', 'NOT_FOUND'));
```

```ts
// Hono equivalent
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const e = normalize(err instanceof HTTPException ? new AppError(err.message || 'Request failed', err.status, 'HTTP_ERROR') : err);
  const log = c.get('log');
  if (e) { log[e.status >= 500 ? 'error' : 'info']({ err: e, code: e.code }, e.message); return c.json(fail(e.message, e.code, e.details), e.status as any); }
  log.error({ err }, 'unhandled error');
  return c.json(fail('Internal server error', 'INTERNAL'), 500);
};
```

Related: [02-backend/error-handling.md](../../02-backend/error-handling.md)
