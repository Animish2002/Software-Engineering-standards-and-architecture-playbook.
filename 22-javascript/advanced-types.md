# Advanced types — used sparingly

## What is it?

TypeScript's more powerful type-level features: `satisfies`, mapped
types, conditional types, and template literal types. Each one solves a
real problem; each one also makes a codebase harder to read when reached
for by default. This page is as much about **when to stop** as how to use
them.

## `satisfies` — the one to reach for often

Checks a value against a type **without widening or losing the literal
type**, unlike a type annotation.

```ts
// Avoid: the annotation widens the values to `string`, so `theme` can't be narrowed to 'light' | 'dark' later
const config: Record<string, string> = { theme: 'dark', apiUrl: 'https://api.example.com' };
config.theme;   // string — lost the literal

// Recommended: satisfies checks the shape but keeps the literal types
const config = { theme: 'dark', apiUrl: 'https://api.example.com' } satisfies Record<string, string>;
config.theme;   // 'dark' — still the literal type
```

```ts
// The pattern used for ROLE_PERMISSION_KEYS-style constant maps
export const ROLE_PERMISSION_KEYS = {
  Employee: ['file:upload', 'file:delete'],
  Admin: ['file:upload', 'file:delete', 'user:manage'],
} satisfies Record<string, string[]>;
// Object.keys(ROLE_PERMISSION_KEYS) is typed as ('Employee' | 'Admin')[], not string[]
```

Use `satisfies` any time you'd otherwise annotate a constant and then
find yourself needing its precise literal keys or values elsewhere.

## Mapped types

Build a new type by transforming every property of an existing one.
Mostly useful for the handful of utility types you'd otherwise write by
hand once ([generics.md](generics.md) already covers the built-in ones —
write a custom mapped type only when none of those fit):

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
```

## Conditional types

A type-level `if`. Genuinely useful for library-style utilities; rare in
application code — most of what you'd reach for is already a built-in
utility type.

```ts
type ElementType<T> = T extends (infer U)[] ? U : never;
type A = ElementType<string[]>;   // string

// A realistic application use: extracting a service's return type for a test helper
type ServiceResult<F> = F extends (...args: any[]) => Promise<infer R> ? R : never;
```

## Template literal types

Build string literal unions from patterns — genuinely useful for
permission keys, route paths, and CSS-variable-style tokens.

```ts
type Resource = 'file' | 'folder' | 'user' | 'audit';
type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view';
type PermissionKey = `${Resource}:${Action}`;   // 'file:create' | 'file:read' | ... every combination

// A closer match to reality: an explicit list, since not every resource/action pair is valid
type RealPermissionKey = 'file:upload' | 'file:delete' | 'user:manage' | 'audit:view' | 'system:health';
```

Prefer the explicit union (`RealPermissionKey`) over the generated
cross-product (`PermissionKey`) whenever not every combination is
actually valid — the cross-product type lies about which strings are real.

## Branded (nominal) types

TypeScript's type system is structural — two types with the same shape
are interchangeable, even when they represent different concepts (a
`UserId` and a `FileId` are both just `string`). A brand adds a
compile-time-only tag to prevent mixing them up:

```ts
type UserId = string & { readonly __brand: 'UserId' };
type FileId = string & { readonly __brand: 'FileId' };

function asUserId(id: string): UserId { return id as UserId; }   // the one place the cast is allowed

function getFile(id: FileId) { /* ... */ }
const userId = asUserId('abc');
getFile(userId);   // compile error — UserId is not assignable to FileId, even though both are strings
```

Worth it only when a real class of bug exists (functions that take
several same-typed string/number ids and could be called with the wrong
one). For two or three id types in a small module, careful naming and
code review usually suffice — introduce branding when the codebase is
large enough that mixing up ids has actually happened, or is genuinely
easy to do by accident.

## When to stop

```text
Does a built-in utility type (Pick, Omit, Partial, Record, ReturnType) already do this?
  └── Yes → use it, stop here — see generics.md
Does `satisfies` solve it (you just want literal-type inference on a constant)?
  └── Yes → use it, stop here
Would a teammate need to look this type up to understand what a function does?
  └── Yes → it's too clever for this codebase — write the concrete, boring version
Is this genuinely a library-style utility (used across many unrelated
  call sites, worth the one-time cost to understand)?
  └── Yes → conditional/mapped types are justified; document what it does with an example
```

## Bad example

```ts
// Avoid: clever, but nobody on the team can read this without deep TS-fu, for a job three lines of
// explicit code would have done just as well
type Flatten<T> = T extends Array<infer U> ? (U extends Array<any> ? Flatten<U> : U) : T;
type DeepKeys<T> = T extends object ? { [K in keyof T]: K extends string ? K | `${K}.${DeepKeys<T[K]> & string}` : never }[keyof T] : never;
```

If a type like this is genuinely needed, it almost always means the
underlying **data structure** should be flattened or restructured instead
— see [00-engineering-principles/abstraction-guidelines.md](../00-engineering-principles/abstraction-guidelines.md)
on premature abstraction, which applies to types exactly as much as it
applies to functions.

## Related

- [generics.md](generics.md)
- [type-narrowing.md](type-narrowing.md)
- [../00-engineering-principles/abstraction-guidelines.md](../00-engineering-principles/abstraction-guidelines.md)
