# TypeScript anti-patterns

Mistakes that pass the compiler but throw away the safety TypeScript is
there to provide.

## `any` as an escape hatch

```ts
// Avoid: any disables checking on this value AND everything derived from it
function handleWebhook(payload: any) {
  processPayment(payload.data.amount);   // no error if payload has no `data`, or `amount` is a string
}
// Recommended: unknown forces validation before use
function handleWebhook(payload: unknown) {
  const event = webhookEventSchema.parse(payload);   // 02-backend/validation.md
  processPayment(event.data.amount);                  // typed and verified
}
```

`any` is occasionally the honest answer (a genuinely untyped third-party
value you're about to validate anyway) — but the type that value should
have at the function boundary is `unknown`, not `any`, so the compiler
still forces a check before use.

## Non-null assertion (`!`) as a substitute for a real check

```ts
// Avoid: tells the compiler "trust me," with no runtime guarantee — crashes if wrong
const user = users.find((u) => u.id === id)!;
user.email;   // if find() actually returned undefined, this throws at runtime with a useless stack

// Recommended: handle the undefined case explicitly
const user = users.find((u) => u.id === id);
if (!user) throw new NotFoundError('User', id);
user.email;   // now genuinely proven, not asserted
```

`!` is acceptable in a narrow set of cases where you have information the
compiler can't see but you're certain of (e.g., right after a `.length`
check, indexing into the same array) — and even then, prefer restructuring
to avoid needing it. Grep for `!` at the end of expressions in review;
each one is a claim worth verifying.

## Type assertions (`as`) instead of narrowing or parsing

```ts
// Avoid: as tells the compiler to believe you; nothing checks that it's true
const config = JSON.parse(raw) as Config;

// Recommended: validate what you're asserting
const config = configSchema.parse(JSON.parse(raw));
```

A cast is appropriate only when you have information the type system
genuinely cannot express and you've verified it by other means (e.g., a
branded-type constructor, see [advanced-types.md](advanced-types.md)) —
never as a way to make a type error go away without addressing why it
appeared.

## `// @ts-ignore` / `// @ts-expect-error` without a reason

```ts
// Avoid: silences the error and every future error on this line, forever
// @ts-ignore
const result = riskyCall(x, y, z);

// Better if truly unavoidable: @ts-expect-error fails the build the moment the underlying issue is fixed
// (forcing the comment's removal) rather than silently drifting — and always explain why:
// @ts-expect-error — upstream @types/lib-x is missing this overload; tracked in LIB-123
const result = riskyCall(x, y, z);
```

Both should be rare enough that each one is a flag in code review, not a
routine tool.

## `enum` when a union of string literals would do

```ts
// Avoid: numeric enums serialise as numbers (unreadable in logs/JSON), and TS enums
// have quirks (reverse mapping, not erased at compile time, awkward across module boundaries)
enum Role { Employee, Admin, SuperAdmin }

// Recommended: a union of string literals — readable everywhere, zero runtime cost, works with Zod directly
type Role = 'Employee' | 'Admin' | 'Super Admin';
const roleSchema = z.enum(['Employee', 'Admin', 'Super Admin']);
```

`const enum` avoids the numeric-enum runtime cost but is incompatible
with `isolatedModules` (see [typescript-configuration.md](typescript-configuration.md)),
which every Vite/esbuild-based project needs — another reason to prefer
plain string unions in this stack.

## Interfaces/types that mirror `any`-shaped reality

```ts
// Avoid: a type that's technically present but adds nothing
type Options = { [key: string]: any };
function configure(options: Options) { }   // no better than `any` — every property access is unchecked
```

If the shape is genuinely open-ended, say so explicitly
(`Record<string, unknown>`) so callers still have to narrow before using
a value; if it isn't, write the real shape.

## Over-widening return types

```ts
// Avoid: the function clearly always returns one of two literal statuses, but the
// signature widens it to string, so callers can't switch on it exhaustively
function getStatus(): string { return isActive ? 'active' : 'inactive'; }

// Recommended
function getStatus(): 'active' | 'inactive' { return isActive ? 'active' : 'inactive'; }
```

## Ignoring `noUncheckedIndexedAccess` findings by asserting instead of handling

```ts
// Avoid — once noUncheckedIndexedAccess is on (see typescript-configuration.md), this becomes T | undefined;
// asserting it away defeats the entire point of turning the flag on
const first = items[0]!;

// Recommended
const first = items[0];
if (!first) return;
```

## Checklist

- [ ] No `any` in application code without a comment explaining why `unknown` + validation wasn't possible.
- [ ] `!` and `as` are rare enough that each one gets a second look in review.
- [ ] No bare `@ts-ignore`; `@ts-expect-error` (if used at all) has a reason and a tracking note.
- [ ] String literal unions instead of `enum` for anything serialised to JSON or a database.
- [ ] Return types aren't wider than what the function actually returns.

## Related

- [type-narrowing.md](type-narrowing.md)
- [typescript-configuration.md](typescript-configuration.md)
- [anti-patterns.md](anti-patterns.md)
