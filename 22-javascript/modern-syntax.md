# Modern syntax

## Destructuring

```ts
const { id, name, ...rest } = user;
const [first, second, ...others] = items;
const { address: { city = 'Unknown' } = {} } = user;      // nested + default
function greet({ name, greeting = 'Hello' }: { name: string; greeting?: string }) { return `${greeting}, ${name}`; }
```

Destructure function parameters for named-argument clarity once a
function has more than two or three params.

## Optional chaining and nullish coalescing

```ts
const city = user?.address?.city;
const handler = obj?.onClick?.();
const items = list?.[0];

const quota = user.storageQuotaBytes ?? DEFAULT_QUOTA;    // only null/undefined fall through
const label = count || 'none';                            // Avoid: 0 and '' also fall through — use ?? unless 0/'' should trigger the default
```

`??=`, `||=`, `&&=` for conditional assignment:

```ts
cache[key] ??= computeExpensive(key);
```

## Spread and rest

```ts
const merged = { ...defaults, ...overrides };             // later keys win
const updated = { ...user, name: 'New Name' };             // immutable update
const combined = [...a, ...b];
const [head, ...tail] = list;
function sum(...nums: number[]) { return nums.reduce((a, b) => a + b, 0); }
```

Spread is a shallow copy. `{ ...user, address: { ...user.address, city } }`
for nested immutable updates.

## Template literals

```ts
const url = `${BASE_URL}/users/${id}`;
const sql = `select * from users where id = ${id}`;        // Avoid for real SQL — use parameters, see 15-security/sql-injection.md
const label = `${count} item${count === 1 ? '' : 's'}`;

// tagged templates: Drizzle's sql``, styled-components-style APIs
const query = sql`select * from users where id = ${userId}`;   // parameters are bound, not interpolated
```

## Array/object shorthand

```ts
const user = { name, email };                              // property shorthand
const api = { get, post, patch, delete: del };              // computed/reserved-word keys need quoting or renaming
const { [key]: value } = obj;                               // computed destructuring
```

## `for...of` / `for...in`

```ts
for (const item of items) { }                               // values — the default choice
for (const [key, value] of Object.entries(obj)) { }
for (const key in obj) { if (Object.hasOwn(obj, key)) { } }  // rare; prefer Object.keys/entries
```

## Logical assignment for guard clauses

```ts
if (!user) throw new NotFoundError('User', id);             // still the clearest form for control flow
```

## Related

- [objects-and-arrays.md](objects-and-arrays.md)
- [types-and-coercion.md](types-and-coercion.md)
