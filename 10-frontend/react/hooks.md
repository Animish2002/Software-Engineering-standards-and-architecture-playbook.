# Hooks

## Built-ins, used well

| Hook | Use | Avoid |
| --- | --- | --- |
| `useState` | Local UI state | Mirroring props; storing derived values |
| `useReducer` | Several related state transitions (a multi-step dialog, a drag state machine) | Replacing `useState` for one value |
| `useEffect` | Subscribe to something external: DOM events, `IntersectionObserver`, timers, `matchMedia`, focus management | Data fetching directly; syncing state to state; anything that could be an event handler |
| `useLayoutEffect` | Measure DOM before paint | Default effects |
| `useRef` | DOM nodes; mutable values that don't drive rendering (latest callback, in-flight flag, resolver function) | State that should re-render |
| `useMemo` | Expensive derivations shown to matter by the profiler; stable object identity for a memoised child | Everything "just in case" |
| `useCallback` | Stable callbacks passed to memoised children or effect deps | Everything |
| `useContext` | Read a provider value | Frequent-change values across a wide tree |
| `useId` | Accessible ids for label/input pairs | Keys |
| `useSyncExternalStore` | Subscribe to a store outside React (Zustand does this) | |
| `useTransition` / `useDeferredValue` | Keep typing responsive while a heavy list filters | Routine state |
| `use` (React 19) | Read a promise/context in render with Suspense | Data fetching without a cache |

## Effect rules

1. **Every reactive value used inside is in the dependency array.** Lint enforces it; don't disable the rule; restructure instead.
2. **Return a cleanup** for anything you subscribe to or start.
3. **Effects run twice in StrictMode dev**: if that breaks it, the effect isn't idempotent; fix the effect.
4. **Unstable function props in deps cause loops.** Store them in a ref and read `ref.current` inside the effect, or ask the caller to memoise.

```ts
const resolverRef = useRef(resolvePreviewUrls);
useEffect(() => { resolverRef.current = resolvePreviewUrls; });
useEffect(() => {
  let cancelled = false;
  resolverRef.current(missingIds).then((urls) => { if (!cancelled) setUrls((u) => ({ ...u, ...urls })); });
  return () => { cancelled = true; };
}, [missingIds]);   // not [resolvePreviewUrls]
```

5. **Don't `setState` in an effect to derive from props.** Compute in render or use `useMemo`.
6. **Race protection**: an effect that fetches must ignore stale results (cancelled flag or `AbortController`).

## Custom hooks

A custom hook packages stateful logic for reuse or readability. Rules:

- Name `useX`; returns an object (`{ data, isLoading, refetch }`) or a tuple for pairs (`[value, setValue]`).
- One concern per hook: `useDriveView(folderId)`, `useUpload()`, `useMediaQuery(query)`, `useDebouncedValue(value, ms)`.
- Hooks that call the API use the API layer, never `fetch`.
- Feature hooks live in the feature; generic ones in `hooks/`.
- Extract a hook when logic is reused **or** when a component's state handling obscures its rendering. Not for every `useState`.

```ts
export function useMediaQuery(query: string) {
  const subscribe = useCallback((cb: () => void) => { const m = matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); }, [query]);
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches, () => false);
}

export function useDebouncedValue<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return debounced;
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  return { open, onOpen: () => setOpen(true), onClose: () => setOpen(false), onOpenChange: setOpen };
}
```

## Component vs hook

```text
Does it render UI?
  ├── Yes → component (may use hooks internally)
  └── No  → is it stateful/effectful?
              ├── Yes → hook
              └── No  → plain function in lib/
```

See [../../23-decision-guides/frontend.md](../../23-decision-guides/frontend.md).

## Related

- [rendering.md](rendering.md)
- [../state-management.md](../state-management.md)
