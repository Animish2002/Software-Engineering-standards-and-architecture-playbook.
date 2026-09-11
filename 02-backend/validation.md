# Validation

## What is it?

Checking every input at the boundary where it enters the system (HTTP body,
query, params, headers, queue messages, environment) against a schema, and
rejecting anything that doesn't match before it reaches business logic.

## Why does it matter?

Unvalidated input is the root of most injection, crash, and data-corruption
bugs. Validation at the boundary means every layer below can trust its
inputs and skip defensive checks.

## Recommended approach

- **Zod**, one schema per shape, in `packages/validation` when the frontend form uses the same shape, otherwise in the module's `*.schema.ts`.
- **Parse, don't check.** `schema.parse(req.body)` returns a typed, coerced value; the `ZodError` is converted to a 400 with field details by the error middleware.
- **Validate params and query too**, with coercion for numbers and booleans.
- **Whitelist by default.** Zod objects strip unknown keys; use `.strict()` on payloads where an unexpected key indicates a bug or attack.
- **Never validate the same shape twice** in the same request path.

```ts
// packages/validation/src/user.ts
export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(128),
  roleId: z.string().uuid(),
  storageQuotaBytes: z.number().int().positive().max(1_000_000_000_000).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

// shared primitives
export const idParamSchema = z.object({ id: z.string().uuid() });
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
```

```ts
// controller
const input = createUserSchema.parse(req.body);
const { page, pageSize } = paginationQuerySchema.parse(req.query);
```

For Hono, `@hono/zod-validator` does the same in the route definition; see
[08-hono/validation.md](../08-hono/validation.md).

### What validation is not

- **Authorization.** "Is this user allowed to set `roleId`?" is a service rule, not a schema rule.
- **Existence.** "Does folder X exist and belong to the caller?" is a service/repository question.
- **Business invariants.** "Quota exceeded" is a rule.

Schemas check *shape and format*; services check *meaning*.

## Bad example

```ts
// Avoid
if (!req.body.email || !req.body.email.includes('@')) return res.status(400).send('bad email');
if (typeof req.body.name !== 'string') return res.status(400).send('bad name');
const quota = parseInt(req.query.quota);   // NaN passes through
```

## Common mistakes

- Trusting `req.params.id` without checking it's a UUID/integer, so the database throws a cast error (500 instead of 400).
- Accepting `ownerId`/`userId` from the body. Identity comes from the token.
- Coercing with `Number(x)` instead of `z.coerce.number().int()` (`Number('')` is `0`).
- Redeclaring the shape as a TypeScript interface next to the schema. Use `z.infer`.
- Validating deep in the service "just in case". Once at the boundary.

## Production considerations

- Limit body size at the parser (`express.json({ limit: '1mb' })`) before Zod sees it.
- Limit array lengths in schemas (`z.array(...).max(200)`) on any endpoint reachable without auth.
- Return field-level errors so forms can show them inline; never return the raw Zod error object with internal paths from nested transforms.

## Checklist

- [ ] Every body, query, and param is parsed by a Zod schema.
- [ ] Shared shapes live in `packages/validation` and are used by the form too.
- [ ] Zod errors map to `400 VALIDATION_FAILED` with details, in one place.
- [ ] No identity or ownership fields accepted from the body.
- [ ] Body size and array lengths are bounded.

## Related

- [05-apis/request-validation.md](../05-apis/request-validation.md)
- [10-frontend/forms-and-validation.md](../10-frontend/forms-and-validation.md)
- [15-security/input-validation.md](../15-security/input-validation.md)
