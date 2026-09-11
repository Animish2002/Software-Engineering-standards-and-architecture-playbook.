# 22 — JavaScript and TypeScript

Language fundamentals that both `apps/web` and `apps/api` rely on. This
playbook writes TypeScript everywhere (`TypeScript strict everywhere` is
a repo-wide rule, not a suggestion), so this section covers the
JavaScript underneath it **and** the type system on top of it.

## JavaScript

| Document | Answers |
| --- | --- |
| [modern-syntax.md](modern-syntax.md) | Destructuring, optional chaining, nullish coalescing, spread, template literals. |
| [modules.md](modules.md) | ESM semantics: imports, live bindings, circular imports. |
| [async.md](async.md) | Promises, async/await, error handling, concurrency. |
| [event-loop.md](event-loop.md) | Call stack, task queue, microtasks — the browser/Node model. |
| [closures-and-scope.md](closures-and-scope.md) | Lexical scope, closures, common pitfalls. |
| [immutability-and-functional.md](immutability-and-functional.md) | Immutable updates, pure functions, array methods. |
| [objects-and-arrays.md](objects-and-arrays.md) | Destructuring, spread, `Object`/`Array` methods worth knowing. |
| [types-and-coercion.md](types-and-coercion.md) | Equality, coercion, `typeof`, safe comparisons. |
| [memory-and-performance.md](memory-and-performance.md) | GC basics, avoiding leaks, hot-path costs. |
| [anti-patterns.md](anti-patterns.md) | The mistakes that show up in review, with fixes. |

## TypeScript

| Document | Answers |
| --- | --- |
| [typescript-configuration.md](typescript-configuration.md) | `tsconfig.json` strict flags explained; monorepo project references; `apps/*` vs `packages/*` configs. |
| [types-vs-interfaces.md](types-vs-interfaces.md) | `type` vs `interface`; when each wins; extending and composing. |
| [generics.md](generics.md) | Generic functions and types; constraints; the built-in utility types worth knowing. |
| [type-narrowing.md](type-narrowing.md) | Control-flow narrowing, type guards, discriminated unions, exhaustiveness checks. |
| [advanced-types.md](advanced-types.md) | `satisfies`, mapped/conditional types, template literal types, branded types — used sparingly, with the line for when it's too clever. |
| [typescript-anti-patterns.md](typescript-anti-patterns.md) | `any`, non-null assertions, type assertions vs guards, enum pitfalls — with fixes. |

## Baseline

Target modern evergreen browsers and Node 22+. No transpilation for
syntax the last two years of both support (optional chaining, nullish
coalescing, top-level await, `Array.prototype.at`, `structuredClone`,
`Object.hasOwn`). Vite/tsc handle the rest. TypeScript target `ES2022`,
`strict: true` everywhere — see [typescript-configuration.md](typescript-configuration.md).
