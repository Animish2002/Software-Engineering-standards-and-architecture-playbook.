# Generics and utility types

## What is it?

A generic lets a function or type be written once and work correctly
across many concrete types, with the relationship between input and
output types preserved and checked by the compiler.

## Why does it matter?

Without generics, a reusable function either loses type information
(typed as `any`/`unknown` in and out) or gets duplicated per type. With
generics, `ApiResult<User>` and `ApiResult<File>` share one definition and
the compiler still knows exactly which shape `data` has in each case.

## Recommended approach

### Generic functions

```ts
// T is inferred from the argument — callers never write it explicitly
export function first<T>(items: T[]): T | undefined {
  return items[0];
}
const u = first(users);   // u: User | undefined — inferred, not annotated

// Constrained generic: T must have an `id`
export function byId<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}
```

### The generic API-envelope pattern used throughout this playbook

```ts
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { message: string; code?: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });
// ok(user) is ApiSuccess<User>; ok(files) is ApiSuccess<File[]> — one function, fully typed both ways
```

### Repository/query helpers

```ts
export function findByEmail<T extends { email: string }>(table: PgTable, email: string): Promise<T | undefined> { /* ... */ }

// A more realistic, concrete version (over-generalising a repository function is usually not worth it — see anti-patterns)
export async function findById(id: string, client: DbOrTx = db): Promise<User | undefined> { /* ... */ }
```

Don't reach for a generic just because a function takes an "id" — most
repository functions should be concretely typed to the one table they
query (see [04-drizzle-orm/repository-pattern.md](../04-drizzle-orm/repository-pattern.md)
on avoiding a generic `BaseRepository<T>`).

## The built-in utility types worth knowing

| Utility | Does | Example |
| --- | --- | --- |
| `Partial<T>` | All properties optional | `Partial<CreateUserInput>` for a PATCH body |
| `Required<T>` | All properties required | Stripping optionality after defaults are applied |
| `Pick<T, K>` | Keep only listed keys | `Pick<User, 'id' \| 'name'>` for a public-facing subset |
| `Omit<T, K>` | Drop listed keys | `Omit<User, 'passwordHash'>` for what the API returns |
| `Record<K, V>` | Object type with keys `K`, values `V` | `Record<string, string[]>` for validation field errors |
| `Readonly<T>` | All properties readonly | A config object that shouldn't be mutated after load |
| `ReturnType<F>` | The return type of a function type | `ReturnType<typeof createApp>` |
| `Parameters<F>` | Tuple of a function's parameter types | Rare; useful for wrapping a function generically |
| `Awaited<T>` | Unwraps a `Promise<T>` (recursively) | `Awaited<ReturnType<typeof fetchUser>>` |
| `NonNullable<T>` | Removes `null \| undefined` | After a guard that already checked, when the compiler needs a nudge |
| `Exclude<T, U>` / `Extract<T, U>` | Remove/keep union members matching `U` | Narrowing a union of string literals |

```ts
export type PublicUser = Omit<User, 'passwordHash'>;
export type UpdateUserInput = Partial<Pick<CreateUserInput, 'name' | 'storageQuotaBytes'>>;
export type FieldErrors = Record<string, string[]>;
```

## When NOT to reach for generics

- A function used with exactly one concrete type today and no plan for a second. Write the concrete version; generalise when the second real caller arrives (same rule of three as [00-engineering-principles/abstraction-guidelines.md](../00-engineering-principles/abstraction-guidelines.md)).
- A generic with so many constraints it's harder to read than three separate concrete functions would be.
- "Generic" as a synonym for "I don't know the type yet" — that's `unknown`, not a type parameter.

## Bad example

```ts
// Avoid: a generic that adds nothing — T is only ever used once and never constrains anything
function wrap<T>(value: T): { value: T } { return { value }; }
// This is no more useful typed generically than concretely for its one real caller; only generalise when a second, different caller needs it too.
```

## Common mistakes

- Over-generalising a repository or service function "for reuse" before a second concrete need exists.
- Forgetting a constraint (`<T extends { id: string }>`) and then fighting the compiler on every property access.
- Using `any` instead of a generic parameter when the function genuinely needs to preserve a caller-specific type.

## Checklist

- [ ] Every generic parameter is actually used more than once in the signature (otherwise it isn't doing anything).
- [ ] Constraints (`extends`) are as narrow as the function actually needs.
- [ ] Utility types (`Omit`, `Pick`, `Partial`) used instead of hand-writing a near-duplicate type.

## Related

- [types-vs-interfaces.md](types-vs-interfaces.md)
- [advanced-types.md](advanced-types.md)
- [../19-reusable-patterns/api/envelope.md](../19-reusable-patterns/api/envelope.md)
