# Status codes

Use the smallest set that carries the meaning. Clients branch on these;
every extra code is a branch to write.

## The set to use

| Code | Use | Body |
| --- | --- | --- |
| **200 OK** | Successful read, update, action, soft-delete | `{ success: true, data }` |
| **201 Created** | Successful create | The created resource |
| **202 Accepted** | Work queued; not done yet | `{ jobId, statusUrl }` |
| **204 No Content** | Success with nothing to return (hard delete, logout) | Empty. Or return 200 with the envelope for consistency; pick one per API |
| **400 Bad Request** | Malformed or invalid input (validation), bad JSON, invalid id format | `VALIDATION_FAILED` with field `details` |
| **401 Unauthorized** | No or invalid credentials (missing/expired token) | `UNAUTHORIZED`; client should refresh or re-login |
| **403 Forbidden** | Authenticated, but not allowed (missing permission key, wrong tier) | `FORBIDDEN` |
| **404 Not Found** | Resource doesn't exist **or the caller can't know it exists** (tenancy) | `NOT_FOUND` |
| **409 Conflict** | State conflict: duplicate unique value, version mismatch, invalid transition | `CONFLICT` / specific code |
| **413 Payload Too Large** | Body over limit | |
| **415 Unsupported Media Type** | Wrong `Content-Type` | |
| **422 Unprocessable Entity** | Optional: semantically invalid but well-formed. Most APIs use 400 for both; if you use 422, use it consistently for validation and 400 for malformed syntax | |
| **429 Too Many Requests** | Rate limited | `RATE_LIMITED` + `Retry-After` header |
| **500 Internal Server Error** | Unhandled error | Generic message; details logged, never returned |
| **502/503/504** | Upstream/unavailable/timeout; usually from the platform | |

## Decisions to make once

- **400 vs 422 for validation**: this playbook uses **400** for all client input problems with `code: VALIDATION_FAILED`.
- **404 vs 403 for other users' resources**: **404**. Don't reveal existence.
- **200 vs 204 for delete**: **200 with the resource** when the delete is soft (the client can show the trashed item); 204 for hard deletes and logout.
- **Health diagnostics**: always **200** with a `status` field in the body. A 5xx from the page that reports outages looks like the outage.

## Anti-patterns

- 200 with `{ success: false }`: clients and monitoring can't see errors.
- 500 for validation or not-found (usually from letting database errors bubble uncaught).
- 401 for "forbidden" and 403 for "not logged in" swapped.
- Custom codes (`299`, `499`). Nothing understands them.

## Related

- [error-format.md](error-format.md)
- [02-backend/error-handling.md](../02-backend/error-handling.md)
