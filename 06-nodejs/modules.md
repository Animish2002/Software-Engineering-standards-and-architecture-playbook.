# Modules in Node.js

## ESM by default

```json
{ "type": "module" }
```

- `import`/`export`; top-level `await` available.
- Relative imports in compiled output need the extension: `import { x } from './x.js'` (TypeScript with `module: NodeNext` enforces this).
- `__dirname`/`__filename` don't exist: use `import.meta.dirname` (Node 20.11+) or `fileURLToPath(new URL('.', import.meta.url))`.
- `require` doesn't exist: `createRequire(import.meta.url)` for the rare CJS-only need. Node 22+ can `require()` ESM in many cases and `import` CJS always.

Use CJS only for legacy code you can't convert.

## Built-ins

Always `node:` prefix: `import { readFile } from 'node:fs/promises'`.
Prevents shadowing by an npm package and makes built-ins obvious.

## Package `exports`

For workspace packages, declare a public surface:

```json
{
  "name": "@app/db",
  "type": "module",
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./dist/index.js" },
    "./schema": { "types": "./src/schema/index.ts", "default": "./dist/schema/index.js" }
  }
}
```

Consumers import `@app/db` and `@app/db/schema`; deep paths are blocked.
During development with `tsx`, point `default` at `src` via a `development`
condition or build packages in watch mode; pick one approach per repo and
document it.

## Module design

- One module = one concern; export a few named functions, no default exports for non-components (named exports refactor and grep better).
- No side effects at import time except creating singletons that are meant to be singletons (`db`, `logger`, `config`). A module that starts a timer or opens a socket on import is a testing hazard.
- Avoid circular imports; they produce `undefined` at runtime in ESM initialisation order. `madge --circular src`.
- Barrel files (`index.ts`) only at module boundaries (a feature's public surface), not in every folder; deep barrels slow startup and hide dependencies.

## Dynamic import

`await import('./heavy.js')` for optional or rarely used code paths
(PDF rendering, CLI-only commands). Keep the default path static.

## Related

- [project-structure.md](project-structure.md)
- [22-javascript/modules.md](../22-javascript/modules.md)
