# Response format

## The envelope

```ts
type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: { message: string; code?: string; details?: unknown } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

Every JSON response, including lists and errors, uses this shape. Declare
it once in `packages/shared-types` and the `ok()`/`fail()` helpers once in
the API.

```ts
// apps/api/src/lib/response.ts
export const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });
export const fail = (message: string, code?: string, details?: unknown): ApiError => ({ success: false, error: { message, code, details } });
```

Why an envelope: the client can discriminate on `success` with a type
guard, list metadata has a home, and errors never get confused with data
that happens to have a `message` field.

## Conventions inside `data`

| Thing | Format |
| --- | --- |
| Field names | `camelCase` |
| Ids | Strings (UUID) |
| Timestamps | ISO 8601 UTC with `Z`: `"2026-09-11T10:15:00.000Z"` |
| Dates without time | `"2026-09-11"` |
| Money | Integer minor units + currency: `{ "amountCents": 1999, "currency": "INR" }` |
| Booleans | `true`/`false`, never `"true"`/`1` |
| Absent optional value | `null`, consistently (not omitted for some and `null` for others) |
| Enums | lowercase strings: `"view"`, `"edit"` |
| Large integers (bytes) | Numbers if < 2^53; strings otherwise, documented |
| Nested resources | Include only what the screen needs; otherwise ids + a separate endpoint |
| Lists | `{ items: [...], ...pagination }`, never a bare array (no room for metadata) |

## Examples

```json
{ "success": true, "data": { "id": "3f…", "name": "Q3 report.pdf", "sizeBytes": 128934, "createdAt": "2026-09-11T10:15:00.000Z", "parentId": null } }
```

```json
{ "success": true, "data": { "items": [ ... ], "nextCursor": "eyJ…", "hasMore": true } }
```

```json
{ "success": true, "data": { "usedBytes": 5120000, "quotaBytes": null } }
```

(`quotaBytes: null` meaning "no ceiling" is a documented convention, not
an accident.)

## Sensitive fields

Never serialise `passwordHash`, tokens, internal keys, or other users'
private fields. Select public columns in the repository so they can't leak
by accident.

## Headers

- `Content-Type: application/json; charset=utf-8`
- `X-Request-Id: <id>` on every response
- `Cache-Control: private, no-store` on authenticated responses

## Related

- [error-format.md](error-format.md)
- [pagination.md](pagination.md)
- [19-reusable-patterns/api/envelope.md](../19-reusable-patterns/api/envelope.md)
