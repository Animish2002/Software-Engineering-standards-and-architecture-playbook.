# React

Modern React (19) as used in a Vite SPA. No server components here; this
is client rendering with a JSON API.

| Document | Answers |
| --- | --- |
| [components.md](components.md) | Writing a component: props, children, composition, file shape. |
| [hooks.md](hooks.md) | Built-in hooks done right; writing custom hooks; effect rules. |
| [rendering.md](rendering.md) | What triggers renders, keys, memoisation, the React Compiler. |
| [patterns.md](patterns.md) | Controlled/uncontrolled, compound components, render props, slots, portals. |

## Ground rules

1. Function components only. No classes except an error boundary (or use `react-error-boundary`).
2. TypeScript props; no `any`; `React.ComponentProps<'button'>` to extend native elements.
3. Derive, don't sync: if a value can be computed from props/state, compute it in render; don't `useEffect` it into state.
4. Effects are for synchronising with something outside React (DOM APIs, subscriptions, timers), not for data flow.
5. Data fetching lives in hooks over the API layer, not in effects inside components.
6. Keys are stable identities, never array indices for reorderable lists.
7. Small components with one purpose; composition over configuration.
