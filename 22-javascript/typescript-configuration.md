# TypeScript configuration

## What is it?

The compiler flags that decide how much TypeScript actually protects you.
Two projects can both be "written in TypeScript" and differ enormously in
how many real bugs the compiler catches, purely based on `tsconfig.json`.

## Why does it matter?

`strict: false` (or unset) lets `null`/`undefined` flow through untyped,
lets implicit `any` hide missing types, and lets array access return a
value that might not exist. Most of the type safety this playbook assumes
elsewhere — narrow `unknown` in catch blocks, exhaustive discriminated
unions, `Zod`-inferred types with no gaps — depends on strict mode being on.

## Recommended approach

### Root `tsconfig.base.json` (shared settings)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "sourceMap": true,
    "declaration": true
  }
}
```

### What each non-default flag buys you

| Flag | Catches |
| --- | --- |
| `strict` | The umbrella: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInCatchVariables`. Never turn this off to "get it working faster." |
| `noUncheckedIndexedAccess` | `arr[i]` and `record[key]` return `T \| undefined`, not `T` — the single flag most likely to catch a real production bug (an out-of-bounds access, a missing map entry) that `strict` alone misses. |
| `noImplicitOverride` | A subclass method must say `override` — catches a typo'd method name that silently created a new method instead of overriding one. |
| `noFallthroughCasesInSwitch` | A `switch` case without `break`/`return` that falls through unintentionally. |
| `noPropertyAccessFromIndexSignature` | Forces `obj['dynamicKey']` instead of `obj.dynamicKey` when the type only has an index signature — makes "is this a known field or a dynamic one" visible at the call site. |
| `isolatedModules` | Required when each file is transpiled independently (Vite, esbuild, `tsx`) — catches TS features (e.g. `const enum`) that can't be compiled file-by-file. |
| `exactOptionalPropertyTypes` | `false` here deliberately — `true` makes `{ x?: string }` reject `{ x: undefined }` explicitly, which is correct but breaks a lot of ordinary object-spread code; enable it per-project only if the team wants that extra precision. |

### Per-app configs extend the base

```json
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": true,
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

The frontend uses `moduleResolution: "Bundler"` (Vite resolves imports
itself) and `noEmit: true` (Vite/esbuild does the actual transpiling;
`tsc` only type-checks). The backend uses `NodeNext` because Node itself
resolves the compiled output.

### Monorepo: packages as project references (optional but recommended past ~3 packages)

```json
// packages/db/tsconfig.json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "composite": true, "outDir": "dist", "rootDir": "src" }, "include": ["src"] }
```

```json
// apps/api/tsconfig.json — reference the packages it depends on
{ "extends": "../../tsconfig.base.json", "references": [{ "path": "../../packages/db" }, { "path": "../../packages/shared-types" }] }
```

`tsc -b` then builds packages in dependency order automatically and only
rebuilds what changed — worth it once `npm run build` order bugs start
appearing (a package built after the app that needs it).

## Bad example

```json
// Avoid
{ "compilerOptions": { "strict": false, "noImplicitAny": false, "skipLibCheck": true, "target": "ES5" } }
```

`target: "ES5"` forces down-leveling of modern syntax for no reason on a
Node 22 / evergreen-browser target, and `strict: false` throws away most
of the value of using TypeScript at all.

## Common mistakes

- Copying a `tsconfig.json` from an old project without revisiting the flags.
- `// @ts-ignore` sprinkled to silence errors instead of fixing the type (see [typescript-anti-patterns.md](typescript-anti-patterns.md)).
- Different strictness per app in the same monorepo — a `shared-types` package built loosely produces types the strict app can't fully trust.
- Forgetting `noUncheckedIndexedAccess` and then writing code that assumes `arr[0]` is always defined.

## Checklist

- [ ] `strict: true` in every app and package.
- [ ] `noUncheckedIndexedAccess: true`.
- [ ] One shared base config; apps/packages only override what's genuinely different (lib, jsx, outDir).
- [ ] `tsc --noEmit` (or `tsc -b`) runs in CI as its own step, separate from the bundler build.

## Related

- [types-vs-interfaces.md](types-vs-interfaces.md)
- [../06-nodejs/project-structure.md](../06-nodejs/project-structure.md)
- [../10-frontend/vite.md](../10-frontend/vite.md)
