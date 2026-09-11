# Error codes

```ts
// packages/shared-types/src/error-codes.ts
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',     // 400, details = field errors
  INVALID_JSON: 'INVALID_JSON',               // 400
  INVALID_REFERENCE: 'INVALID_REFERENCE',     // 400, FK target missing
  UNAUTHORIZED: 'UNAUTHORIZED',               // 401
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',             // 401, client should refresh
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED', // 401 on login/refresh
  FORBIDDEN: 'FORBIDDEN',                     // 403
  NOT_FOUND: 'NOT_FOUND',                     // 404
  CONFLICT: 'CONFLICT',                       // 409
  VERSION_MISMATCH: 'VERSION_MISMATCH',       // 409, details.currentVersion
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',           // 409
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',     // 413
  RATE_LIMITED: 'RATE_LIMITED',               // 429, details.retryAfterSeconds
  INTERNAL: 'INTERNAL',                       // 500
  // client-only
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  BAD_RESPONSE: 'BAD_RESPONSE',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

```ts
// frontend: one place that decides what to do with an error
export function handleApiError(error: ApiFailure, opts: { form?: UseFormReturn<any> } = {}) {
  switch (error.code) {
    case ErrorCode.VALIDATION_FAILED:
      if (opts.form && applyServerErrors(opts.form, error)) return;
      return toast.error(error.message);
    case ErrorCode.RATE_LIMITED:
      return toast.error(`Too many requests. Try again in ${(error.details as any)?.retryAfterSeconds ?? 'a few'} seconds.`);
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      return;                                            // http.ts already redirected to login
    case ErrorCode.NETWORK:
    case ErrorCode.TIMEOUT:
      return toast.error('Connection problem. Check your network and try again.');
    default:
      return toast.error(error.message);
  }
}
```

Add domain codes (`SHARE_REVOKED`, `CANNOT_MOVE_INTO_SELF`) only when the
client must react differently from the generic handling.

Related: [05-apis/error-format.md](../../05-apis/error-format.md)
