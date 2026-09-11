# API integration

## Layers

```text
component ─► feature hook ─► lib/api/<resource>.ts (typed functions) ─► lib/http.ts ─► fetch
                  ▲
            cache / revalidation
```

Pages and components **never** call `fetch` or `http` directly.

## `lib/http.ts`: the one client

Responsibilities: base URL, JSON encoding, `Authorization` header from the
in-memory access token, refresh-on-401 (once, single-flight), envelope
parsing, result type, request id capture, timeouts.

```ts
import type { ApiResponse } from '@app/shared-types';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { message: string; code?: string; details?: unknown } };

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    const body = (await res.json().catch(() => null)) as ApiResponse<{ accessToken: string }> | null;
    if (body?.success) { setAccessToken(body.data.accessToken); return true; }
    setAccessToken(null); onSessionExpired(); return false;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export async function request<T>(path: string, init: RequestInit & { retry?: boolean } = {}): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include', signal: init.signal ?? AbortSignal.timeout(20_000) });
  } catch (err) {
    return { ok: false, error: { message: 'Network error', code: 'NETWORK' } };
  }
  if (res.status === 401 && init.retry !== false && (await refresh())) return request<T>(path, { ...init, retry: false });
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) return { ok: false, error: { message: `Unexpected response (${res.status})`, code: 'BAD_RESPONSE' } };
  return body.success ? { ok: true, data: body.data } : { ok: false, error: body.error };
}

export const http = {
  get: <T>(p: string, init?: RequestInit) => request<T>(p, { ...init, method: 'GET' }),
  post: <T>(p: string, body?: unknown, init?: RequestInit) => request<T>(p, { ...init, method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(p: string, body?: unknown) => request<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
```

## `lib/api/<resource>.ts`: typed functions

```ts
import { http } from '../http';
import type { DriveView, FolderItem } from '@app/shared-types';
import type { CreateFolderInput } from '@app/validation';

export const view = (folderId: string | null) => http.get<DriveView>(`/items/view${folderId ? `?folderId=${folderId}` : ''}`);
export const createFolder = (input: CreateFolderInput) => http.post<FolderItem>('/folders', input);
export const trash = (id: string) => http.post<DriveItem>(`/items/${id}/trash`);
```

Multi-step client orchestration (create row → presigned PUT → confirm)
lives here too, still returning `ApiResult`.

## Hooks: cache and revalidation

Either TanStack Query or a hand-rolled module cache that speaks
`ApiResult`. The contract is the same:

- `isLoading`: no data → skeleton.
- `isRevalidating`: data present, refreshing → `GlobalProgressBar`, never a skeleton.
- `markStale(prefix)` after mutations; entries are refetched on next use, not dropped.
- Cache cleared on logout/session expiry.
- Resolver functions stored in refs when passed as props so an inline arrow can't cause a refetch loop.

```ts
export function useDriveView(folderId: string | null) {
  return useApiQuery(['items', 'view', folderId], () => api.items.view(folderId));
}
export function useCreateFolder() {
  return useApiMutation(api.items.createFolder, { onSuccess: () => markStale(['items']) });
}
```

## Uploads and downloads

- Never through the API: `POST /files` returns `{ file, uploadUrl }`; the browser `PUT`s to object storage with `XMLHttpRequest` (for progress) or `fetch`.
- Progress keyed by the `File` object, not its name.
- Downloads: `GET /items/:id/download-url` → `{ url }` → `window.location`/`<a download>`.
- Batch preview URLs per grid (`POST /items/preview-urls { ids }`), not one request per card.

## Errors

- Never throw from API functions; return `ok: false`.
- Hooks expose `error`; components render `ErrorState` or a toast ([error-and-loading-states.md](error-and-loading-states.md)).
- `VALIDATION_FAILED` details map to form field errors.
- Session expiry: `onSessionExpired()` clears cache and redirects to login with `returnTo`.

## Don't

- Store the access token in `localStorage`.
- Call `fetch` in a component or an effect.
- Redeclare API types locally; import from `@app/shared-types`.
- Retry non-idempotent requests automatically.

## Related

- [state-management.md](state-management.md)
- [19-reusable-patterns/frontend/api-client.md](../19-reusable-patterns/frontend/api-client.md)
- [05-apis/response-format.md](../05-apis/response-format.md)
