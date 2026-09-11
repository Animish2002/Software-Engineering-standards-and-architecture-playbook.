# Error format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable, safe to show to the user",
    "code": "STABLE_MACHINE_CODE",
    "details": { "optional": "structured context" }
  }
}
```

## Rules

- `message` is safe to display: no SQL, stack traces, file paths, internal ids.
- `code` is stable and documented; clients branch on it, never on `message`.
- `details` is optional and structured: field errors for validation, `retryAfter` for rate limits, `currentVersion` for conflicts.
- The HTTP status matches the code family ([status-codes.md](status-codes.md)).
- The same error shape for unmatched routes (404), auth failures, and validation.

## Standard codes

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Input didn't match the schema; `details` has field errors |
| `INVALID_JSON` | 400 | Body not parseable |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired access token |
| `TOKEN_EXPIRED` | 401 | Optional refinement so the client refreshes without guessing |
| `ACCOUNT_DEACTIVATED` | 401 | Login/refresh blocked for a trashed account |
| `FORBIDDEN` | 403 | Lacks permission key or tier |
| `NOT_FOUND` | 404 | Resource missing or invisible to caller |
| `CONFLICT` | 409 | Unique violation, invalid state transition |
| `VERSION_MISMATCH` | 409 | Optimistic concurrency failed; `details.currentVersion` |
| `QUOTA_EXCEEDED` | 409 (or 413) | Storage/limit rule |
| `RATE_LIMITED` | 429 | `details.retryAfterSeconds` + `Retry-After` header |
| `PAYLOAD_TOO_LARGE` | 413 | |
| `INTERNAL` | 500 | Unexpected; logged with request id |

Add domain codes sparingly (`SHARE_REVOKED`, `CANNOT_MOVE_INTO_SELF`) when
the client must react differently. Otherwise reuse the standard ones.

## Validation details

```json
"details": { "email": ["Invalid email"], "items.2.quantity": ["Must be positive"] }
```

Flattened from Zod's `flatten().fieldErrors` (or `issues` mapped by path
for nested objects).

## Client handling

```ts
if (!res.success) {
  switch (res.error.code) {
    case 'UNAUTHORIZED': return refreshAndRetry();
    case 'VALIDATION_FAILED': return form.setErrors(res.error.details);
    case 'RATE_LIMITED': return toast(`Try again in ${res.error.details.retryAfterSeconds}s`);
    default: return toast(res.error.message);
  }
}
```

## Related

- [02-backend/error-handling.md](../02-backend/error-handling.md)
- [19-reusable-patterns/api/error-codes.md](../19-reusable-patterns/api/error-codes.md)
