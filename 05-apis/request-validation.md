# Request validation (contract)

Implementation is in [02-backend/validation.md](../02-backend/validation.md).
This page defines what the API promises.

## What is validated

| Part | Rules |
| --- | --- |
| Path params | Type/format (UUID, integer). Invalid → 400, never 404 or 500. |
| Query params | Coerced (`page=2` → number), defaulted, bounded (`pageSize ≤ 100`), whitelisted (`sort` in an allowed set). Unknown params ignored. |
| Body | Zod schema; unknown fields **stripped** (or rejected with `.strict()` where an unexpected key is suspicious). Required vs optional explicit. Strings trimmed; emails lowercased. |
| Headers | `Content-Type: application/json` for JSON bodies (415 otherwise); `Authorization` format; `Idempotency-Key` format where accepted. |
| Size | JSON body ≤ 1 MB by default; arrays ≤ 200 items on public endpoints; strings bounded. |

## What is not validated here

Existence and permissions. "Folder not found" and "you may not upload
here" are service outcomes (404/403), not validation errors.

## Error shape

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_FAILED",
    "details": {
      "email": ["Invalid email"],
      "password": ["String must contain at least 12 character(s)"]
    }
  }
}
```

`details` is keyed by field path so the form can show inline errors.
Nested paths use dots: `"address.zip"`.

## Shared schemas

The same Zod schema validates the form in the browser and the body on the
server. Client-side validation is UX; server-side is enforcement. Never
skip the server side because the client validated.

## Related

- [error-format.md](error-format.md)
- [10-frontend/forms-and-validation.md](../10-frontend/forms-and-validation.md)
