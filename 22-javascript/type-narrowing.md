# Type narrowing and guards

## What is it?

TypeScript tracking, from control flow alone, that a broader type has
been proven to be a narrower one within a branch — no cast required.

## Why does it matter?

Narrowing is how `unknown` (from a `catch` block, a JSON parse, an
external API) becomes safely usable without `any`, and how a union type
(`ApiResult<T>`, a discriminated state) becomes exhaustively and safely
handled.

## Built-in narrowing the compiler already does

```ts
function handle(value: string | number) {
  if (typeof value === 'string') value.toUpperCase();   // value: string here
  else value.toFixed(2);                                  // value: number here
}

function process(err: unknown) {
  if (err instanceof AppError) err.status;                // err: AppError here
  else if (err instanceof Error) err.message;              // err: Error here
}

function render(item: DriveItem) {
  if ('parentId' in item) { /* narrows if the union members differ by key presence */ }
}

const user = users.find((u) => u.id === id);
if (user) user.email;   // user: User here (not User | undefined) — the `if` narrowed it
```

## Discriminated unions (the pattern to prefer over booleans)

A shared literal field (`status`, `type`, `success`) lets TypeScript
narrow the *whole* object, not just one field — this is the mechanism
behind `ApiResponse<T>` throughout this playbook.

```ts
type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'error'; error: Error }
  | { status: 'done'; file: File };

function render(state: UploadState) {
  switch (state.status) {
    case 'idle': return null;
    case 'uploading': return `${state.progress}%`;     // state.progress exists here — proven by the discriminant
    case 'error': return state.error.message;            // state.file would be a compile error here
    case 'done': return state.file.name;
  }
}
```

```ts
// Avoid: independent booleans can represent impossible states, and nothing narrows together
type UploadState = { isLoading: boolean; isError: boolean; progress?: number; error?: Error; file?: File };
// { isLoading: true, isError: true } compiles fine and means nothing
```

See also [00-engineering-principles/clean-code.md](../00-engineering-principles/clean-code.md#values-and-types).

## Exhaustiveness checking

```ts
function label(status: ShareStatus): string {
  switch (status) {
    case 'active': return 'Active';
    case 'revoked': return 'Revoked';
    case 'expired': return 'Expired';
    default:
      return assertNever(status);   // compile error if a new ShareStatus value is added and not handled here
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
```

This is the single highest-value narrowing pattern for maintainability:
adding a new member to a union and forgetting to handle it somewhere
becomes a **compile error** at every `assertNever` call site, instead of
a runtime bug discovered later.

## Custom type guards

```ts
type PgError = { code: string; constraint?: string };

function isPgError(err: unknown, code?: string): err is PgError {
  return typeof err === 'object' && err !== null && 'code' in err
    && typeof (err as PgError).code === 'string'
    && (!code || (err as PgError).code === code);
}

// usage — the `err is PgError` return type is what lets this narrow err for the caller
if (isPgError(err, '23505')) { /* err: PgError here */ }
```

## Zod as a runtime type guard

Narrowing only works on types the compiler already trusts; it can't
verify data crossing a real boundary (an HTTP body, `JSON.parse`, an
environment variable). Zod's `.parse()`/`.safeParse()` is the narrowing
step for anything crossing that boundary — see
[02-backend/validation.md](../02-backend/validation.md).

```ts
const result = createUserSchema.safeParse(req.body);
if (!result.success) return /* 400 */;
result.data;   // typed as CreateUserInput — proven by the schema, not asserted
```

## Common mistakes

```ts
// Avoid: a type assertion instead of a guard — lies to the compiler if wrong, no runtime check
const user = data as User;

// Recommended: a guard that actually verifies
function isUser(data: unknown): data is User { return typeof data === 'object' && data !== null && 'id' in data && 'email' in data; }
if (isUser(data)) { /* trustworthy */ }
```

- `switch` without a `default: assertNever(...)` on a union that might grow.
- Narrowing that's invalidated by an intervening `await` (state can change between the check and the use in async code — re-check after awaiting if the value could have changed).
- Casting (`as T`) to silence an error instead of narrowing — see [typescript-anti-patterns.md](typescript-anti-patterns.md).

## Checklist

- [ ] Unions used for state (`ApiResult`, upload/dialog state) are discriminated by a literal field, not represented as independent booleans.
- [ ] Every `switch` over a union has an exhaustiveness check (`assertNever`) or an explicit `default`.
- [ ] Data crossing a real boundary is validated with Zod, not just type-asserted.
- [ ] `catch (err)` treats `err` as `unknown` and narrows before use.

## Related

- [advanced-types.md](advanced-types.md)
- [../02-backend/validation.md](../02-backend/validation.md)
- [../10-frontend/state-management.md](../10-frontend/state-management.md)
