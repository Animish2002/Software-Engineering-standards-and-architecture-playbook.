# ES modules

Runtime specifics (Node's `type: module`, `node:` imports, `exports`
maps) are in [06-nodejs/modules.md](../06-nodejs/modules.md). This page is
the language semantics.

## Imports and exports

```ts
export const formatBytes = (n: number) => { /* ... */ };   // named export — preferred
export default function App() { }                          // default — reserve for the one-component-per-file case

import { formatBytes } from './format';
import App from './App';
import * as api from './lib/api';                           // namespace import when you want the grouping visible
```

Prefer named exports everywhere except a React component's own file,
where a default export lets `lazy(() => import('./Page'))` work directly.

## Live bindings

Unlike CommonJS, an ES module export is a **live binding**, not a copied
value:

```ts
// counter.ts
export let count = 0;
export const increment = () => { count++; };

// main.ts
import { count, increment } from './counter';
increment();
console.log(count);   // 1 — the importer sees the updated value
```

Useful for a module-level cache or config that's mutated after import;
surprising if you expect a snapshot. Prefer exporting a function
(`getCount()`) over a mutable binding when the intent is "read the current
value," so the read is explicit at every call site.

## Static analysis and tree-shaking

Imports/exports are resolved statically (not conditionally computed),
which is what lets bundlers tree-shake unused exports. Side-effectful
top-level code in a module defeats tree-shaking for that module — keep
modules free of side effects except deliberate singletons (`db`, `logger`).

## Circular imports

```ts
// a.ts
import { b } from './b';
export const a = 'a';
// b.ts
import { a } from './a';   // `a` is undefined here if b.ts runs first — a hasn't been assigned yet
export const b = 'b';
```

ESM handles cycles better than CJS (bindings update once both finish
initialising), but relying on it is fragile. If two modules import each
other, the design has a missing boundary — extract the shared piece into a
third module, or invert the dependency.

## Dynamic import

```ts
const { renderPdf } = await import('./pdf-renderer');       // code-split, loaded on demand
```

Returns a promise resolving to the module namespace. Use for optional,
rarely used, or heavy code paths (see [10-frontend/vite.md](../10-frontend/vite.md)).

## Related

- [06-nodejs/modules.md](../06-nodejs/modules.md)
- [01-project-architecture/dependency-management.md](../01-project-architecture/dependency-management.md)
