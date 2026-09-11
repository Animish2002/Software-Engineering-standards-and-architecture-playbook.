# Objects and arrays

## Useful `Object` methods

```ts
Object.keys(obj);                          // string[] of own enumerable keys
Object.values(obj);
Object.entries(obj);                       // [key, value][] — the usual iteration form
Object.fromEntries(pairs);                 // inverse of entries — build an object from pairs
Object.assign({}, a, b);                   // shallow merge — prefer { ...a, ...b } in new code
Object.hasOwn(obj, 'key');                 // safe own-property check (replaces obj.hasOwnProperty(key))
Object.groupBy(items, (i) => i.status);    // ES2024 — group an array into an object keyed by the callback's result
```

```ts
// grouping without Object.groupBy (still common; both are fine)
const byStatus = items.reduce<Record<string, Item[]>>((acc, item) => {
  (acc[item.status] ??= []).push(item);
  return acc;
}, {});
```

## Building lookup maps

The N+1-in-memory pattern — turn a list into a `Map` once, then look up by
id instead of `.find()`-ing repeatedly:

```ts
// Avoid: O(n*m) — a .find() per row inside a loop
const rows = orders.map((o) => ({ ...o, customerName: customers.find((c) => c.id === o.customerId)?.name }));

// Recommended: O(n+m) — build the map once
const customerById = new Map(customers.map((c) => [c.id, c]));
const rows = orders.map((o) => ({ ...o, customerName: customerById.get(o.customerId)?.name }));
```

Prefer `Map` over a plain object as a lookup table when keys aren't known
string literals — it avoids prototype-chain surprises (`hasOwnProperty`,
`__proto__` as a key) and has a real `.size` and `.has()`.

## `Set` for uniqueness and membership

```ts
const uniqueIds = [...new Set(items.map((i) => i.id))];
const allowed = new Set(['admin', 'editor']);
if (allowed.has(role)) { }
```

## Optional/default parameters vs destructured options

```ts
// Fine for 1-2 params
function greet(name: string, greeting = 'Hello') { }
// Prefer for 3+ params, especially with optional ones — call sites stay readable
function createUser({ email, name, roleId, quotaBytes = DEFAULT_QUOTA }: CreateUserOptions) { }
```

## Shallow vs deep equality

```ts
a === b                    // reference equality for objects/arrays; value equality for primitives
JSON.stringify(a) === JSON.stringify(b)   // Avoid — key order matters, drops undefined/functions, expensive
structuredClone comparisons — no; use a real deep-equal (lodash.isequal, fast-deep-equal) if you actually need one
```

Most "deep equality" needs in this stack are really "did the id change" or
"did this specific field change" — compare that field directly instead of
reaching for deep equality.

## Array vs object: which to model with

| Use an array | Use an object/`Map` |
| --- | --- |
| Order matters | Order doesn't matter |
| You mostly iterate the whole collection | You mostly look up by a known key |
| Items don't have a natural unique id | Items have a natural unique id |

Normalised state (a `Record<id, Item>` plus an `ids: string[]` for order)
avoids O(n) lookups in larger lists; a plain array is fine and simpler
for anything under a few hundred items rendered as-is.

## Related

- [immutability-and-functional.md](immutability-and-functional.md)
- [../03-databases/query-optimization.md](../03-databases/query-optimization.md) (the N+1 pattern in SQL)
