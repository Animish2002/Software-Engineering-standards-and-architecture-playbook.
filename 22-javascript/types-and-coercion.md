# Types and coercion

## Equality

```ts
1 === 1;            // true
1 === '1';           // false — === never coerces
1 == '1';             // true — == coerces; avoid it
null == undefined;    // true — the one == case that's sometimes intentionally used
null === undefined;   // false
NaN === NaN;          // false — NaN never equals anything, including itself
Number.isNaN(NaN);    // true — the only reliable NaN check
Object.is(NaN, NaN);  // true — also handles +0/-0 distinctly; rarely needed
```

Always use `===`/`!==`. The one common exception some style guides allow
is `== null` to check for both `null` and `undefined` in one comparison —
prefer `value == null` only if the team has agreed to it; `value === null
|| value === undefined` (or optional chaining / `??`) is equally clear and
avoids training anyone to reach for `==` elsewhere.

## Truthy/falsy

Falsy: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`. Everything
else — including `'0'`, `[]`, `{}` — is truthy.

```ts
if (items.length) { }        // fine: 0 is falsy, correctly means "empty"
if (items) { }                // Avoid if items could be [] — an empty array is truthy; this checks "is items defined", not "is items non-empty"
if (quota) { }                 // Avoid if quota could legitimately be 0 — use quota != null
```

## Coercion in practice

```ts
Number('42');          // 42
Number('42px');         // NaN — strict; use parseInt for "parse the leading number"
parseInt('42px', 10);    // 42
Number('');              // 0 — surprising; validate before converting user input
+'' ;                     // 0 — same surprise via unary plus
String(42);                // '42'
`${42}`;                    // '42'
Boolean(0);                  // false
!!value;                      // common idiom for "coerce to boolean"
```

Never rely on implicit coercion in comparisons or arithmetic on values
that could be user input. Validate and parse explicitly (Zod's
`z.coerce.number()` does this correctly, rejecting `''` and `'42px'`
rather than silently producing `0`/`NaN` — see
[02-backend/validation.md](../02-backend/validation.md)).

## `typeof` and `instanceof`

```ts
typeof 'x';          // 'string'
typeof 42;             // 'number'
typeof undefined;       // 'undefined'
typeof null;              // 'object' — a long-standing JS quirk; check `value === null` explicitly
typeof [];                  // 'object' — arrays aren't a distinct typeof; use Array.isArray()
typeof function () {};        // 'function'

err instanceof Error;           // works for classes, including custom AppError subclasses
Array.isArray(value);            // the correct array check
```

## `unknown` vs `any` in TypeScript

```ts
// Avoid: any disables all type checking on this value and everything derived from it
function handle(err: any) { err.whatever.deeply.nested(); }   // no error, crashes at runtime

// Recommended: unknown forces narrowing before use
function handle(err: unknown) {
  if (err instanceof AppError) { /* err.status, err.code available here */ }
  else if (err instanceof Error) { /* err.message available */ }
  else { /* unknown shape — handle generically */ }
}
```

`catch` clause variables are `unknown` by default in modern TypeScript —
narrow before accessing properties, never cast straight to `any`.

## Number precision

```ts
0.1 + 0.2;                 // 0.30000000000000004 — IEEE 754 floating point
Number.isSafeInteger(n);    // true up to 2^53 - 1
```

Never use floats for money — store integer minor units (cents) or use a
decimal library; see [03-databases/postgres/data-types.md](../03-databases/postgres/data-types.md).
`bigint` (the `123n` literal) for values that must exceed
`Number.MAX_SAFE_INTEGER` exactly — note it can't mix with `number` in
arithmetic without explicit conversion.

## Related

- [../02-backend/validation.md](../02-backend/validation.md)
- [anti-patterns.md](anti-patterns.md)
