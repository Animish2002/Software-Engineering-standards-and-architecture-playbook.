# State management

## Four kinds of state, four homes

| Kind | Examples | Home | Tool |
| --- | --- | --- | --- |
| **Local UI** | open/closed, hover, input draft, selected tab | The component (or its parent if shared by siblings) | `useState`, `useReducer` |
| **URL** | current folder, page, filters, sort, search query | The URL | React Router params / search params |
| **Server** | lists, details, current user, quotas | A cache keyed by request | TanStack Query **or** a hand-rolled cache speaking the API envelope |
| **Global client** | auth session, theme, upload queue, toasts | One provider or a tiny store | Context for rarely-changing values; Zustand for frequently-changing or outside-React updates |

Most "global state" problems are server state handled badly. Solve those
with the cache layer, not a store.

## Decision

```text
Does the state come from the server?
  ├── Yes → server-state cache (query hook). Never copy into useState.
  └── No
       Does it belong in the URL (shareable, refresh-safe)?
         ├── Yes → search params / route params
         └── No
              Is it used by one component (and maybe its children)?
                ├── Yes → useState in that component; pass props down
                └── No
                     Does it change often or from outside React (sockets, upload progress)?
                       ├── Yes → Zustand store
                       └── No  → Context (auth, theme)
```

See [23-decision-guides/frontend.md](../23-decision-guides/frontend.md).

## Server state rules

- Keyed by the request (`['items', folderId]`), shared by every component that needs it.
- Distinguish **loading** (no data yet → skeleton) from **revalidating** (data present, refreshing → thin progress bar).
- After a mutation, **mark stale and refetch in the background**; don't drop the entry (a mounted page would flash a skeleton).
- Cleared on logout and session expiry so one user's data can't show for the next.
- Module-level (survives unmount) so navigating back is instant.

```ts
// with TanStack Query
const { data, isPending, isFetching, error } = useQuery({ queryKey: ['items', folderId], queryFn: () => api.items.view(folderId), staleTime: 30_000 });
const isLoading = isPending;              // nothing to show
const isRevalidating = isFetching && !isPending;
// after a mutation
queryClient.invalidateQueries({ queryKey: ['items'] });   // TanStack keeps stale data while refetching, so no flash
```

## Context rules

- One provider per concern (`CurrentUserProvider`, `ThemeProvider`), composed in `app/providers.tsx`.
- Context values that change often re-render every consumer; split hot and cold values or use a store.
- Expose a hook (`useCurrentUser()`) that throws if used outside the provider.

## Zustand rules (when needed)

```ts
export const useUploadStore = create<UploadState>((set) => ({
  uploads: {},
  start: (file) => set((s) => ({ uploads: { ...s.uploads, [fileKey(file)]: { file, progress: 0, status: 'uploading' } } })),
  progress: (file, p) => set((s) => ({ uploads: { ...s.uploads, [fileKey(file)]: { ...s.uploads[fileKey(file)]!, progress: p } } })),
}));
```

Key by an identity, not a name (a folder upload has several same-named
files). Select slices (`useUploadStore((s) => s.uploads[key])`) to avoid
re-rendering the whole panel.

## Anti-patterns

- Copying query data into `useState` "to edit it" (form state should be the form library's; derive initial values from the query).
- A global store holding server data with manual "refresh" logic.
- Prop drilling through six levels instead of composition (`children`) or a context for the subtree.
- `useEffect` to sync one state to another; derive it instead.

## Related

- [api-integration.md](api-integration.md)
- [react/hooks.md](react/hooks.md)
