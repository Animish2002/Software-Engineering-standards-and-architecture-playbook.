# Rendering

## What triggers a render

A component re-renders when its **state** changes, its **parent** re-renders,
or a **context** it reads changes. Props changing is a consequence of the
parent rendering; React doesn't diff props to decide whether to render
unless the component is memoised.

Rendering is cheap unless the tree is large or the render does expensive
work. Optimise when the profiler shows a problem.

## Keys

- Stable identity (`item.id`), never the index for lists that reorder, filter, or delete.
- Changing a key remounts the subtree; use it deliberately to reset state (`<Form key={userId} />`).
- Keys must be unique among siblings only.

## Memoisation

| Tool | When |
| --- | --- |
| `memo(Component)` | A component re-renders often with the same props and its render is measurably heavy (rows in a big grid) |
| `useMemo` | A derivation is expensive (sorting/filtering thousands of items) or must keep identity for a memoised child |
| `useCallback` | A callback goes to a memoised child or an effect dependency |
| **React Compiler** (React 19, opt-in via Babel plugin) | Automates most of the above; if enabled, write plain code and let it memoise |

Default: none of it. Add after profiling. Memoising everything makes
code noisier and can be slower (comparison cost).

## Keeping renders small

- Keep fast-changing state (input text, hover) as low in the tree as possible.
- Split contexts: `CurrentUserContext` (rarely changes) separate from `UploadProgressContext` (changes constantly), or use a store with selectors.
- Pass `children` through a stateful wrapper so the children don't re-render with the wrapper's state:

```tsx
function Collapsible({ children }) { const [open, setOpen] = useState(false); return <div>{/* toggle */}{open && children}</div>; }
// children were created by the parent; Collapsible's state change doesn't re-render them
```

## Lists

- Hundreds of rows: fine with `memo` on the row.
- Thousands: virtualise (`@tanstack/react-virtual`) or cap the DOM and summarise.
- Expensive per-item work (thumbnails): gate on visibility with `IntersectionObserver`, memoise by URL.

## Concurrent features

- `useTransition` for state updates that trigger heavy renders (filter a big grid) so typing stays responsive.
- `useDeferredValue` for a derived heavy value from fast-changing input.
- `Suspense` around lazy routes and data-fetching libraries that support it.

## StrictMode

Keep it on in development. It double-invokes render and effects to
surface impure code. Fix the code, don't disable StrictMode.

## Profiling

React DevTools → Profiler → record an interaction → look for wide bars
(many components) or tall bars (slow components). "Why did this render?"
shows the cause.

## Related

- [hooks.md](hooks.md)
- [../performance.md](../performance.md)
