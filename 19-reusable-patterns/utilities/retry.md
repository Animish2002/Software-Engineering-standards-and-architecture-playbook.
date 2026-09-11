# Retry with backoff

```ts
// lib/retry.ts
export type RetryOptions = {
  attempts?: number;            // total attempts including the first
  baseMs?: number;              // first delay
  maxMs?: number;               // cap per delay
  retryOn?: (err: unknown) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
};

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); reject(signal.reason); }, { once: true });
});

export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { attempts = 3, baseMs = 100, maxMs = 5_000, retryOn = () => true, onRetry, signal } = opts;
  for (let attempt = 1; ; attempt++) {
    try { return await fn(attempt); }
    catch (err) {
      if (attempt >= attempts || !retryOn(err) || signal?.aborted) throw err;
      const delay = Math.min(maxMs, baseMs * 2 ** (attempt - 1)) * (0.5 + Math.random());   // full jitter
      onRetry?.(err, attempt, delay);
      await sleep(delay, signal);
    }
  }
}

// common predicates
export const isTransientHttp = (err: unknown) => err instanceof Response ? err.status >= 500 || err.status === 429 : true;
export const isPgTransient = (err: unknown) => ['40001', '40P01', '57P01', '08006'].includes((err as any)?.code);
```

```ts
await retry(() => storage.getUploadUrl(key, type), { attempts: 3, retryOn: isTransientHttp });
await retry(() => db.transaction(fn, { isolationLevel: 'serializable' }), { retryOn: isPgTransient });
```

Only retry idempotent operations and transient failures. Never retry a
400/401/403/404.
