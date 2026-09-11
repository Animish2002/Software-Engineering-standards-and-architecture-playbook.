# `useApiQuery`: module-level cache with revalidation

A small alternative to TanStack Query that speaks `ApiResult` directly.
Use TanStack Query if you want retries, devtools, and infinite queries
out of the box; keep this if you want zero dependencies and full control.

```ts
// lib/api-cache.ts
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { ApiResult, ApiFailure } from './http';

type Entry<T> = { data?: T; error?: ApiFailure; stale: boolean; inflight?: Promise<void>; updatedAt: number };
const cache = new Map<string, Entry<unknown>>();
const listeners = new Map<string, Set<() => void>>();
let inflightCount = 0;
const globalListeners = new Set<() => void>();

const notify = (key: string) => listeners.get(key)?.forEach((l) => l());
const notifyGlobal = () => globalListeners.forEach((l) => l());

export const keyOf = (parts: readonly unknown[]) => JSON.stringify(parts);

export function markStale(prefix: readonly unknown[]) {
  const p = keyOf(prefix).slice(0, -1);              // strip closing bracket → prefix match
  for (const [k, e] of cache) if (k.startsWith(p)) { e.stale = true; notify(k); }
}
export function invalidate(prefix: readonly unknown[]) {   // drops entries: mounted consumers go back to isLoading. Prefer markStale.
  const p = keyOf(prefix).slice(0, -1);
  for (const k of [...cache.keys()]) if (k.startsWith(p)) { cache.delete(k); notify(k); }
}
export function clearCache() { cache.clear(); for (const k of listeners.keys()) notify(k); }

export function useGlobalInflight() {
  return useSyncExternalStore((l) => { globalListeners.add(l); return () => globalListeners.delete(l); }, () => inflightCount > 0);
}

async function load<T>(key: string, fetcher: () => Promise<ApiResult<T>>) {
  const entry = (cache.get(key) as Entry<T> | undefined) ?? { stale: true, updatedAt: 0 };
  if (entry.inflight) return entry.inflight;
  inflightCount++; notifyGlobal();
  entry.inflight = (async () => {
    const res = await fetcher();
    const e = cache.get(key) as Entry<T> | undefined ?? entry;
    if (res.ok) { e.data = res.data; e.error = undefined; } else { e.error = res.error; }
    e.stale = false; e.updatedAt = Date.now(); e.inflight = undefined;
    cache.set(key, e as Entry<unknown>);
    inflightCount--; notifyGlobal(); notify(key);
  })();
  cache.set(key, entry as Entry<unknown>);
  notify(key);
  return entry.inflight;
}

export function useApiQuery<T>(parts: readonly unknown[], fetcher: () => Promise<ApiResult<T>>, { enabled = true, staleMs = 30_000 } = {}) {
  const key = keyOf(parts);
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const subscribe = useCallback((l: () => void) => { const s = listeners.get(key) ?? new Set(); s.add(l); listeners.set(key, s); return () => { s.delete(l); }; }, [key]);
  const entry = useSyncExternalStore(subscribe, () => cache.get(key) as Entry<T> | undefined, () => undefined);

  useEffect(() => {
    if (!enabled) return;
    const e = cache.get(key) as Entry<T> | undefined;
    const isStale = !e || e.stale || Date.now() - e.updatedAt > staleMs;
    if (isStale) void load(key, () => fetcherRef.current());
  }, [key, enabled, staleMs]);

  const refetch = useCallback(() => load(key, () => fetcherRef.current()), [key]);

  const hasData = entry?.data !== undefined;
  return {
    data: entry?.data,
    error: entry?.error,
    isLoading: enabled && !hasData && !entry?.error,           // nothing to show → skeleton
    isRevalidating: !!entry?.inflight && hasData,               // real data refreshing → thin bar
    refetch,
  };
}

export function useApiMutation<TInput, TOut>(fn: (input: TInput) => Promise<ApiResult<TOut>>, opts: { onSuccess?: (out: TOut, input: TInput) => void; staleKeys?: readonly (readonly unknown[])[] } = {}) {
  const [isPending, setPending] = useState(false);
  const mutateAsync = useCallback(async (input: TInput) => {
    setPending(true);
    try {
      const res = await fn(input);
      if (res.ok) { opts.staleKeys?.forEach(markStale); opts.onSuccess?.(res.data, input); }
      return res;
    } finally { setPending(false); }
  }, [fn, opts.onSuccess, opts.staleKeys]);
  return { mutateAsync, isPending };
}
```

Wire `clearCache()` into logout and the session-expired handler. The
header's `GlobalProgressBar` reads `useGlobalInflight()`.

Related: [10-frontend/state-management.md](../../10-frontend/state-management.md)
