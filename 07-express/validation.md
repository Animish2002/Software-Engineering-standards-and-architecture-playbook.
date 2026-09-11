# Validation in Express

Contract: [05-apis/request-validation.md](../05-apis/request-validation.md).
Principles: [02-backend/validation.md](../02-backend/validation.md).

## Inline parse (recommended)

```ts
export async function create(req: Request, res: Response) {
  const input = createUserSchema.parse(req.body);          // ZodError → 400 via error middleware
  const { id } = idParamSchema.parse(req.params);
  const { page, pageSize } = paginationQuerySchema.parse(req.query);
  // ...
}
```

Simple, typed, one line per source. The error middleware converts
`ZodError` to `400 VALIDATION_FAILED` with `details`.

## Middleware variant (alternative)

When you'd rather see schemas in the routes file:

```ts
export const validate = (schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) res.locals.query = schemas.query.parse(req.query);   // req.query is a getter in Express 5; don't assign to it
    if (schemas.params) res.locals.params = schemas.params.parse(req.params);
    next();
  };
router.post('/', validate({ body: createUserSchema }), c.create);
```

Pick one style per project.

## Error conversion

```ts
// in error-handler.ts
if (err instanceof ZodError) {
  const details = err.flatten().fieldErrors;                // { email: ['Invalid email'] }
  return res.status(400).json(fail('Validation failed', 'VALIDATION_FAILED', details));
}
```

## Body parser errors

Malformed JSON throws a `SyntaxError` with `type === 'entity.parse.failed'`
from `express.json`; oversized bodies throw `entity.too.large`. Map both in
the error middleware (400 `INVALID_JSON`, 413 `PAYLOAD_TOO_LARGE`).

## Related

- [error-handling.md](error-handling.md)
