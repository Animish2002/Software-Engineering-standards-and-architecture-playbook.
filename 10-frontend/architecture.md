# Frontend architecture

## Layers

```text
app/          router, providers, layouts        ← wiring only
pages/        route components                  ← compose features; read params
features/     feature components + hooks + api  ← where the product lives
components/   shared UI (ui/, common/, forms/)  ← no business logic, no fetching
hooks/        cross-feature hooks               ← no feature knowledge
lib/          http client, api cache, format, cn, constants
```

| Layer | May import | Must not |
| --- | --- | --- |
| `app/` | pages, providers, layouts | feature internals |
| `pages/` | features (via `index.ts`), layouts, common components | `lib/http` directly, `fetch` |
| `features/*` | own files, `components/*`, `hooks/*`, `lib/*`, other features' `index.ts` | other features' internals |
| `components/*` | `lib/cn`, `lib/format`, other components | features, `lib/api` |
| `hooks/*` | `lib/*` | features, components |
| `lib/*` | nothing above it | React components (except `lib/current-user.tsx`-style providers, which are `app/providers` territory) |

## Data flow

```text
route param ─► page ─► feature hook (useFolder(id)) ─► lib/api/items.ts ─► lib/http.ts ─► API
                          │
                          ├─ cache/revalidate (lib/api-cache or TanStack Query)
                          ▼
                    feature components (props in, callbacks out)
                          ▼
                    shared components (ui/common)
```

- **Hooks own async state** (`data`, `isLoading`, `isRevalidating`, `error`) and mutations.
- **Components are pure given props**; interaction bubbles up as callbacks.
- **Mutations** call `lib/api`, then mark the affected cache stale (not invalidate: dropping an entry a mounted page shows sends it back to `isLoading` and flashes a skeleton).

## Cross-cutting

| Concern | Where |
| --- | --- |
| Auth state (`user`, `permissionKeys`) | One provider in `app/providers`; `useCurrentUser()`; `hasPermission(keys, 'file:upload')` pure function |
| Permission gating of routes | `RequirePermission` wrapper component in the router |
| Theme | Provider + CSS variables; Tailwind `dark:` |
| Toasts | One `Toaster` at the root; `toast()` from anywhere |
| Global progress bar (revalidating) | Header component reads a shared "in-flight" counter |
| Error boundaries | Route-level, with a `ErrorState` that offers retry |
| Upload progress / long tasks | A small store (Zustand or context) because it outlives navigation |

## When to add

| Signal | Add |
| --- | --- |
| Two features need the same server data with caching | TanStack Query (or keep the hand-rolled cache if it already exists and works) |
| State needed by unrelated subtrees and outliving routes (uploads, WebSocket) | Zustand store (tiny) |
| Forms with more than a couple of fields | react-hook-form + shared Zod schema |
| Lists over ~200 rows rendered at once | Virtualisation |

Don't add Redux, MobX, or a global store "for later".

## Related

- [project-structure.md](project-structure.md)
- [state-management.md](state-management.md)
- [api-integration.md](api-integration.md)
- [01-project-architecture/feature-based-architecture.md](../01-project-architecture/feature-based-architecture.md)
