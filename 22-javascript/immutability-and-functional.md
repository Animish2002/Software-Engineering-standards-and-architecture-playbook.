# Immutability and functional patterns

## Why immutability matters here

React and most state-management tools detect changes by **reference
equality**. Mutating an object in place produces the same reference, so
the framework doesn't know anything changed.

```ts
// Avoid: mutation — React won't re-render; the array reference is unchanged
items.push(newItem);
setItems(items);

// Recommended: new reference
setItems([...items, newItem]);
```

## Immutable update patterns

```ts
// Add
const withItem = [...items, newItem];
// Remove
const withoutItem = items.filter((i) => i.id !== targetId);
// Update one
const updated = items.map((i) => (i.id === targetId ? { ...i, name: newName } : i));
// Update nested object
const updatedUser = { ...user, address: { ...user.address, city: newCity } };
// Update nested array inside an object
const updatedFolder = { ...folder, files: folder.files.map((f) => (f.id === id ? { ...f, name } : f)) };
```

For deeply nested state, prefer restructuring the state shape (normalise
by id, see below) over deep spread chains. If deep updates are frequent
and the spread chains get unreadable, `immer`'s `produce()` lets you write
mutation-style code that produces an immutable result — a reasonable
dependency for genuinely nested state, not a default.

## Array methods: the functional core

| Method | Returns | Use |
| --- | --- | --- |
| `.map` | New array, same length | Transform each item |
| `.filter` | New array, subset | Keep matching items |
| `.reduce` | Any single value | Aggregate, build a different shape |
| `.find` / `.findIndex` | First match / its index | Locate one item |
| `.some` / `.every` | boolean | Existence / universality checks |
| `.flatMap` | Flattened new array | Map then flatten one level |
| `.at(-1)` | Element or `undefined` | Last item without `.length - 1` |
| `.toSorted` / `.toReversed` / `.toSpliced` (ES2023) | New array | Sort/reverse/splice **without** mutating the original |

```ts
// Avoid: sort() mutates in place
const sorted = items.sort((a, b) => a.name.localeCompare(b.name));   // also mutated `items`!
// Recommended
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
// or, where toSorted isn't available yet
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
```

`.sort`, `.reverse`, `.splice`, `.push`, `.pop`, `.shift`, `.unshift` all
mutate. Know which methods mutate before reaching for them on state.

## Pure functions

A pure function's output depends only on its inputs, and it has no
observable side effects (no mutation of arguments, no I/O, no reading
mutable outside state).

```ts
// Pure — same input always gives the same output; safe to memoise, test, reuse
export function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Impure — depends on and mutates outside state
let total = 0;
export function addToTotal(item: LineItem) { total += item.price; }
```

Push impurity to the edges (React components' effects, service functions
that call the database) and keep calculation/transformation logic pure.
Pure functions need no mocks in tests.

## `Object.freeze` (shallow, and a footgun to know about)

```ts
export const ROLE_TIERS = Object.freeze(['Employee', 'Admin', 'Super Admin']);
```

`Object.freeze` only prevents reassigning top-level properties — nested
objects are still mutable. Useful for a small constant array/object;
not a substitute for a real immutable-update discipline on state.

## Structured cloning for a true deep copy

```ts
const copy = structuredClone(original);   // built-in, handles Dates/Maps/Sets/typed arrays; not functions or class instances
```

Prefer this over `JSON.parse(JSON.stringify(x))`, which silently drops
`undefined`, functions, and `Date` (converts to string).

## Related

- [objects-and-arrays.md](objects-and-arrays.md)
- [../10-frontend/state-management.md](../10-frontend/state-management.md)
