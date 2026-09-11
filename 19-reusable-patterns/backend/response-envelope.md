# Response envelope helpers

```ts
// packages/shared-types/src/api.ts
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { message: string; code?: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
export type CursorPage<T> = { items: T[]; nextCursor: string | null; hasMore: boolean };
```

```ts
// apps/api/src/lib/response.ts
import type { ApiSuccess, ApiError } from '@app/shared-types';

export const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });
export const fail = (message: string, code?: string, details?: unknown): ApiError => ({
  success: false,
  error: { message, ...(code && { code }), ...(details !== undefined && { details }) },
});
```

Usage: `res.status(201).json(ok(user))`, `c.json(ok(items))`.

Related: [05-apis/response-format.md](../../05-apis/response-format.md)
