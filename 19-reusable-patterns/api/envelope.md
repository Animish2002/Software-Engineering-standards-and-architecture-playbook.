# API envelope (shared types)

```ts
// packages/shared-types/src/api.ts
export type ApiSuccess<T> = { success: true; data: T };
export type ApiErrorBody = { message: string; code?: string; details?: unknown };
export type ApiError = { success: false; error: ApiErrorBody };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const isApiSuccess = <T>(r: ApiResponse<T>): r is ApiSuccess<T> => r.success === true;
export const isApiError = <T>(r: ApiResponse<T>): r is ApiError => r.success === false;

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
export type CursorPage<T> = { items: T[]; nextCursor: string | null; hasMore: boolean };
```

Server: `ok()`/`fail()` produce these ([../backend/response-envelope.md](../backend/response-envelope.md)).
Client: `http.ts` converts them to `ApiResult<T>` ([../frontend/api-client.md](../frontend/api-client.md)).

Related: [05-apis/response-format.md](../../05-apis/response-format.md)
