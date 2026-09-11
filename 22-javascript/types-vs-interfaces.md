# `type` vs `interface`

## What is it?

Two ways to name a shape in TypeScript. They overlap heavily; the
differences are narrow but decide which one reads more naturally for a
given job.

## The practical difference

| | `interface` | `type` |
| --- | --- | --- |
| Object shapes | Yes | Yes |
| Unions (`'a' \| 'b'`) | No | Yes |
| Tuples | Awkward | Yes |
| Mapped/conditional types | No | Yes |
| Extending another shape | `extends` (can extend multiple) | `&` intersection |
| Declaration merging (two declarations of the same name combine) | Yes — often unwanted | No |
| Implementing in a class | `implements InterfaceName` | `implements TypeName` (works the same for object-shaped types) |

## Recommended approach

**Default to `type`.** It covers everything `interface` does for plain
object shapes, plus unions, tuples, and mapped types that `interface`
can't express at all. Reach for `interface` specifically when:

- Declaration merging is a feature you want (rare in application code — mostly relevant when augmenting a third-party library's types, e.g. extending Express's `Request`).
- You're defining the public shape of something meant to be extended by consumers in multiple places (a plugin API), where merging is genuinely useful.

```ts
// Recommended: type for everything by default
export type CreateUserInput = { email: string; name: string; password: string; roleId: string };
export type ShareType = 'link' | 'user';
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiErrorBody };

// interface: the one common legitimate case — augmenting a third-party type via declaration merging
declare global {
  namespace Express {
    interface Request { id: string; user?: AuthUser; }   // merges into Express's own Request interface
  }
}
```

## Extending

```ts
// type: intersection
type WithTimestamps = { createdAt: Date; updatedAt: Date };
type User = { id: string; email: string } & WithTimestamps;

// interface: extends (reads slightly more naturally for a clear "is-a" hierarchy)
interface Animal { name: string }
interface Dog extends Animal { breed: string }
```

Both compile to essentially the same thing for plain object extension;
pick whichever reads better in context, but be consistent within a
codebase — don't mix `extends`-style interfaces and `&`-style types for
the same kind of relationship.

## Why declaration merging is usually a footgun in application code

```ts
// Avoid, outside of the third-party-augmentation case above:
interface Config { apiUrl: string }
// ... 200 lines later, in a different file ...
interface Config { timeout: number }   // this SILENTLY MERGES with the one above — no error, easy to miss
```

`type` throws a compile error on a duplicate name instead, which is the
behaviour you want for anything you're not deliberately augmenting.

## Deriving types instead of declaring them twice

The single most valuable habit in this section: don't hand-write a type
next to a Zod schema, a Drizzle table, or another type that already
implies it.

```ts
// Recommended — one source of truth
export const createUserSchema = z.object({ email: z.string().email(), name: z.string(), password: z.string().min(12) });
export type CreateUserInput = z.infer<typeof createUserSchema>;      // 02-backend/validation.md

export const users = pgTable('users', { id: uuid('id').primaryKey(), email: text('email').notNull() });
export type User = typeof users.$inferSelect;                        // 04-drizzle-orm/schema.md

type PartialUser = Pick<User, 'id' | 'email'>;                       // derived, not redeclared
```

```ts
// Avoid: a second, hand-maintained copy that drifts the moment the schema changes
export type CreateUserInput = { email: string; name: string; password: string };   // redundant with the Zod schema above
```

## Common mistakes

- Redeclaring a shape that a Zod schema, Drizzle table, or API response type already implies.
- Using `interface` purely out of habit from another language, then hitting a union type and having to switch to `type` mid-file anyway.
- Unintentional declaration merging (two `interface`s with the same name in different files, both compiling silently into one).

## Checklist

- [ ] `type` by default; `interface` reserved for declaration merging (mainly third-party augmentation).
- [ ] No type hand-written next to a Zod schema, Drizzle table, or another type it should be derived from.
- [ ] Shared cross-boundary types live in `packages/shared-types`, not redeclared per app.

## Related

- [generics.md](generics.md)
- [../02-backend/validation.md](../02-backend/validation.md)
- [../04-drizzle-orm/schema.md](../04-drizzle-orm/schema.md)
