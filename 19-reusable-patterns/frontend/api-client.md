# API client (`lib/http.ts`)

```ts
import type { ApiResponse } from '@app/shared-types';

export type ApiFailure = { message: string; code?: string; details?: unknown };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

const BASE = import.meta.env.VITE_API_URL as string;

let accessToken: string | null = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => { accessToken = token; };

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler = () => {};
export const setSessionExpiredHandler = (fn: SessionExpiredHandler) => { onSessionExpired = fn; };

let refreshing: Promise<boolean> | null = null;
async function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      const body = (await res.json().catch(() => null)) as ApiResponse<{ accessToken: string }> | null;
      if (res.ok && body?.success) { setAccessToken(body.data.accessToken); return true; }
    } catch { /* network */ }
    setAccessToken(null);
    onSessionExpired();
    return false;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

type RequestInit2 = RequestInit & { retryOn401?: boolean; timeoutMs?: number };

export async function request<T>(path: string, init: RequestInit2 = {}): Promise<ApiResult<T>> {
  const { retryOn401 = true, timeoutMs = 20_000, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (rest.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...rest, headers, credentials: 'include', signal: rest.signal ?? AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    return { ok: false, error: { message: timedOut ? 'Request timed out' : 'Network error', code: timedOut ? 'TIMEOUT' : 'NETWORK' } };
  }

  if (res.status === 401 && retryOn401 && !path.startsWith('/auth/')) {
    if (await refreshAccessToken()) return request<T>(path, { ...init, retryOn401: false });
    return { ok: false, error: { message: 'Session expired', code: 'UNAUTHORIZED' } };
  }

  if (res.status === 204) return { ok: true, data: undefined as T };
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body || typeof body !== 'object' || !('success' in body)) {
    return { ok: false, error: { message: `Unexpected response (${res.status})`, code: 'BAD_RESPONSE' } };
  }
  return body.success ? { ok: true, data: body.data } : { ok: false, error: body.error };
}

const json = (b: unknown) => (b === undefined ? undefined : JSON.stringify(b));
export const http = {
  get: <T>(path: string, init?: RequestInit2) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit2) => request<T>(path, { ...init, method: 'POST', body: json(body) }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit2) => request<T>(path, { ...init, method: 'PATCH', body: json(body) }),
  delete: <T>(path: string, init?: RequestInit2) => request<T>(path, { ...init, method: 'DELETE' }),
};

export const qs = (params: Record<string, string | number | boolean | null | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};
```

```ts
// lib/api/items.ts
export const view = (folderId: string | null) => http.get<DriveView>(`/items/view${qs({ folderId })}`);
export const createFolder = (input: CreateFolderInput) => http.post<FolderItem>('/folders', input);
```

Related: [10-frontend/api-integration.md](../../10-frontend/api-integration.md)
