# Error, loading, and empty states

## The loading contract (project rule)

| State | Meaning | Render |
| --- | --- | --- |
| `isLoading` | No data to show yet | Skeleton matching the final layout |
| `isRevalidating` | Data present, a refresh is in flight | Thin `GlobalProgressBar` in the header; content stays |
| `error` with no data | The request failed and there's nothing cached | `ErrorState` with retry |
| `error` with data | Refresh failed; stale data still shown | Toast; keep content |
| Empty | Loaded, zero items | `EmptyState` with a primary action |

Never show a skeleton over data that already exists. Never replace content
with a spinner on refetch.

## Shared components (`components/common/`)

```tsx
<LoadingState variant="grid" />                       // skeleton variants: list, grid, table, form
<ErrorState title="Couldn't load files" description={error.message} onRetry={refetch} />
<EmptyState icon={FolderOpen} title="This folder is empty" description="Upload files or create a folder." action={<Button onClick={openUpload}>Upload</Button>} />
```

Each takes a handful of props and is used by every page. Pages never
hand-write `<p>Loading...</p>`.

## Pattern in a page

```tsx
const { data, isLoading, isRevalidating, error, refetch } = useDriveView(folderId);
if (isLoading) return <LoadingState variant="grid" />;
if (error && !data) return <ErrorState description={error.message} onRetry={refetch} />;
if (data.items.length === 0) return <EmptyState … />;
return <DriveItemGrid items={data.items} … />;
```

`isRevalidating` is consumed by the header, not by the page.

## Error boundaries

- One `errorElement` per top-level layout route rendering `RouteErrorState` (message + "Try again" that resets the boundary/navigates).
- Boundaries catch **render** errors. API failures are data (`error` in hooks), not exceptions.
- Log boundary errors to the error reporter with the current route.

## Toasts

- One `<Toaster />` (sonner) at the root.
- Success toasts are short; error toasts carry `error.message` (already safe from the API).
- Mutations: optimistic UI only where rollback is trivial; otherwise toast on completion.
- No native `alert`.

## Long operations

- Uploads: a persistent progress panel (store-backed) with per-item rows capped in height (scroll inside), a combined bar, and collapse; rows beyond a few hundred summarised as "+N more".
- A `beforeunload` guard while uploads are in flight is the one accepted native prompt (prevents data loss). No others.

## Related

- [api-integration.md](api-integration.md)
- [components/catalog.md](components/catalog.md)
