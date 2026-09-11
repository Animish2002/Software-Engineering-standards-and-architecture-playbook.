# 22 — JavaScript

Language fundamentals that both `apps/web` and `apps/api` rely on.
TypeScript is assumed throughout this playbook; this section is about the
JavaScript underneath it.

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

## Baseline

Target modern evergreen browsers and Node 22+. No transpilation for
syntax the last two years of both support (optional chaining, nullish
coalescing, top-level await, `Array.prototype.at`, `structuredClone`,
`Object.hasOwn`). Vite/tsc handle the rest.
