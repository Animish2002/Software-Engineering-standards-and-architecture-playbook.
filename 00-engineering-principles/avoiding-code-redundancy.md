# Avoiding code redundancy

## What is it?

A map of where duplication actually accumulates in a full-stack JavaScript
application, and the single place each kind of knowledge should live.
[dry-kiss-yagni.md](dry-kiss-yagni.md) covers the principle; this file covers
the practice.

## Where duplication hides, and the fix

| Duplication | Symptom | Single source of truth |
| --- | --- | --- |
| Validation rules | Email regex in the form and in the API | One Zod schema in a shared package, imported by both. [02-backend/validation.md](../02-backend/validation.md), [10-frontend/forms-and-validation.md](../10-frontend/forms-and-validation.md) |
| Types / shapes | `User` declared in `apps/web` and again in `apps/api` | `packages/shared-types`, or `z.infer<typeof userSchema>` from the schema above |
| HTTP calls | `fetch(...)` with headers repeated per feature | One `http.ts` client; feature modules export typed functions. [10-frontend/api-integration.md](../10-frontend/api-integration.md) |
| Response envelope | Each controller builds `{ success: true, data }` by hand | `ok()`/`fail()` helpers. [05-apis/response-format.md](../05-apis/response-format.md) |
| Error → status mapping | `try/catch` with `res.status(...)` in every handler | Error classes + one error middleware. [error-handling.md](error-handling.md) |
| Auth checks | `if (!req.user)` at the top of every handler | `authenticate` and `requirePermission()` middleware. [02-backend/authorization.md](../02-backend/authorization.md) |
| Soft-delete filter | `where deletedAt is null` in every query | A base filter helper or a database view. [03-databases/soft-deletes-and-audit-columns.md](../03-databases/soft-deletes-and-audit-columns.md) |
| Pagination parsing | `page`/`pageSize` parsed and clamped per route | One `parsePagination(query)` helper. [19-reusable-patterns/backend/pagination.md](../19-reusable-patterns/backend/pagination.md) |
| Loading / error / empty UI | Every page hand-writes a spinner and an error `<p>` | `LoadingState`, `ErrorState`, `EmptyState` components. [10-frontend/error-and-loading-states.md](../10-frontend/error-and-loading-states.md) |
| Page chrome | Header + sidebar + container copied per page | Layout routes. [10-frontend/layouts.md](../10-frontend/layouts.md) |
| Tailwind class strings | The same 14 utilities on every card | `cva` variants or a small component. [11-tailwind/avoiding-duplication.md](../11-tailwind/avoiding-duplication.md) |
| Config reads | `process.env.X ?? 'default'` scattered | One validated `config` module. [configuration-management.md](configuration-management.md) |
| Date / money formatting | `toLocaleDateString` with different options everywhere | `lib/format.ts` with named formatters |
| Constants | `'admin'` string literal in 20 files | `constants/roles.ts`, or better, permission keys from the database |

## Recommended approach

1. **Put boundaries in one place.** HTTP client, response envelope, error
   mapping, config, logging. These are set up once per project from
   [19-reusable-patterns/](../19-reusable-patterns/README.md).
2. **Share knowledge, not code shape.** A validation schema is knowledge; two
   components that both use a flex row are not.
3. **Prefer composition over configuration.** Small components and functions
   assembled per use-case beat one configurable unit.
4. **Extract on the third occurrence** when all three change together.
5. **Name the extracted unit after the domain**, not after where it was found.

## Example: eliminating one duplication end to end

Before: the `createUser` shape exists three times.

```text
apps/web/src/features/users/CreateUserForm.tsx   → hand-written rules
apps/api/src/controllers/users.controller.ts     → hand-written checks
apps/api/src/types/user.ts                       → interface CreateUser
```

After:

```ts
// packages/validation/src/user.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(12),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

```ts
// API
const input = createUserSchema.parse(req.body);
// Form
const form = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema) });
```

One rule, one type, two consumers.

## Common mistakes

- Sharing UI components across features that merely look alike (see [abstraction-guidelines.md](abstraction-guidelines.md)).
- A `utils/` folder with hundreds of unrelated helpers. Group by purpose (`format`, `dates`, `ids`).
- Copying a whole feature folder to start a new feature, then leaving the dead parts.
- Deduplicating tests. Test duplication is usually fine; clarity beats brevity there.

## Checklist

- [ ] Validation schemas are shared between API and forms.
- [ ] Types are derived from schemas or a shared package, never redeclared.
- [ ] One HTTP client, one envelope helper, one error middleware, one config module.
- [ ] Loading, error, and empty states are shared components.
- [ ] Page chrome is a layout, not copied per page.
- [ ] No string literal used as an enum in more than one file.

## Related

- [abstraction-guidelines.md](abstraction-guidelines.md)
- [19-reusable-patterns/README.md](../19-reusable-patterns/README.md)
