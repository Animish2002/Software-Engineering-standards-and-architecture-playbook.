# 10 — Frontend (React + Vite)

How to structure a React application so that features stay isolated, UI is
composed from a small set of shared parts, server data is handled in one
layer, and pages don't accumulate logic. Styling is in
[11-tailwind/](../11-tailwind/README.md) and [12-shadcn/](../12-shadcn/README.md).

| Document | Answers |
| --- | --- |
| [architecture.md](architecture.md) | The layers of a frontend and their rules. |
| [project-structure.md](project-structure.md) | Folder layout and what goes where. |
| [react/](react/README.md) | Components, hooks, rendering, and patterns in React 19. |
| [vite.md](vite.md) | Config, env, aliases, build, code splitting. |
| [components/](components/README.md) | **Reusable components without universal components.** Composition, variants, catalog, when not to reuse. |
| [layouts.md](layouts.md) | Layout routes, shells, page headers. |
| [routing.md](routing.md) | React Router: routes, loaders vs hooks, guards. |
| [state-management.md](state-management.md) | Local, URL, server, and global state; when each. |
| [api-integration.md](api-integration.md) | One HTTP client, typed API functions, result types, caching and revalidation. |
| [forms-and-validation.md](forms-and-validation.md) | react-hook-form + shared Zod schemas + shadcn Form. |
| [error-and-loading-states.md](error-and-loading-states.md) | Loading vs revalidating, skeletons, error boundaries, empty states, toasts. |
| [performance.md](performance.md) | Rendering, memoisation, code splitting, lists, images. |
| [accessibility.md](accessibility.md) | Keyboard, focus, labels, contrast, live regions. |
| [testing.md](testing.md) | What to test in a frontend and how. |
| [security.md](security.md) | XSS, tokens, CSP, dependencies. |

Checklist: [21-checklists/frontend-checklist.md](../21-checklists/frontend-checklist.md).
Decision guides: [23-decision-guides/frontend.md](../23-decision-guides/frontend.md).

## The rules in one place

1. **Pages compose; they don't compute.** A page renders feature components and passes route params; logic lives in hooks and the API layer.
2. **Components never `fetch`.** All server calls go through `lib/api/*`, which returns an `ApiResult<T>`.
3. **Server state is not React state.** Cache and revalidate through one mechanism (TanStack Query, or the hand-rolled cache) so "back" is instant and data doesn't flash.
4. **`isLoading` = nothing to show (skeleton); `isRevalidating` = real data refreshing (thin progress bar, never a skeleton).**
5. **Shared UI is small primitives that compose**, not one component with thirty props.
6. **Validation schemas are shared with the API.**
7. **Feature folders mirror API modules.**
8. **No native browser dialogs.** Every confirmation is a `Dialog`/`AlertDialog`; every outcome is a toast.
