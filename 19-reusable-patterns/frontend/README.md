# Frontend patterns

| File | Purpose |
| --- | --- |
| [api-client.md](api-client.md) | `lib/http.ts`: base URL, auth header, single-flight refresh on 401, envelope → `ApiResult` |
| [use-api-query.md](use-api-query.md) | Module-level cache with `isLoading` vs `isRevalidating`, `markStale`, cleared on logout |
| [confirm-dialog.md](confirm-dialog.md) | `ConfirmDialog` on shadcn `AlertDialog` with pending state |
| [states.md](states.md) | `LoadingState`, `ErrorState`, `EmptyState` |
| [apply-server-errors.md](apply-server-errors.md) | Map `VALIDATION_FAILED` details onto react-hook-form fields |

If the project uses TanStack Query, skip `use-api-query.md` and keep the
same `isLoading`/`isRevalidating` contract (`isPending` / `isFetching && !isPending`).
