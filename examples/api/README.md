# Example: one endpoint's full contract

`POST /shares/person` — sharing a file with another user by email. Shows
[05-apis/request-validation.md](../../05-apis/request-validation.md),
[05-apis/response-format.md](../../05-apis/response-format.md), and
[05-apis/error-format.md](../../05-apis/error-format.md) as the single
contract a test file and a frontend caller both rely on.

## Request

```http
POST /shares/person
Authorization: Bearer <access token>
Content-Type: application/json

{ "resourceId": "3f2a1c9e-...", "email": "colleague@example.com", "permission": "edit" }
```

## Schema (shared with the frontend form)

```ts
// packages/validation/src/shares.ts
export const sharePersonSchema = z.object({
  resourceId: id,
  email,
  permission: z.enum(['view', 'edit']).default('view'),
});
```

## Success response

```json
{
  "success": true,
  "data": {
    "id": "8b1e...", "resourceType": "file", "resourceId": "3f2a1c9e-...",
    "shareType": "user", "permission": "edit",
    "sharedWithUserId": "9c4d...", "createdAt": "2026-09-11T10:15:00.000Z"
  }
}
```

## Error responses (every branch the service can take)

| Condition | Status | Body |
| --- | --- | --- |
| Malformed email / missing fields | 400 | `{ "success": false, "error": { "message": "Validation failed", "code": "VALIDATION_FAILED", "details": { "email": ["Invalid email"] } } }` |
| No token | 401 | `{ "success": false, "error": { "message": "Authentication required", "code": "UNAUTHORIZED" } }` |
| Caller lacks `file:share` | 403 | `{ "success": false, "error": { "message": "Forbidden", "code": "FORBIDDEN" } }` |
| Resource doesn't exist or caller can't see it | 404 | `{ "success": false, "error": { "message": "File ... not found", "code": "NOT_FOUND" } }` |
| Recipient email doesn't match a real user | 201 (**not an error** — see below) | Same success shape, `sharedWithUserId: null`; a guest-share token is emailed instead |

Note the last row: "email doesn't match an account" is a valid,
successful outcome (a guest share), not a failure — see
[README.md](../../README.md)'s sharing section in the project this
pattern is drawn from. This is exactly the kind of branch a spec like this
table exists to make explicit before writing the test file.

## The API test (mirrors the table above 1:1)

```ts
test.describe('POST /shares/person', () => {
  test('shares with an existing user and notifies them', async ({ request }) => { /* 201, sharedWithUserId set */ });
  test('shares with an unknown email as a guest link', async ({ request }) => { /* 201, sharedWithUserId null */ });
  test('400 on invalid email', async ({ request }) => { /* VALIDATION_FAILED, details.email */ });
  test('403 without file:share', async ({ request }) => { /* role lacking the key */ });
  test('404 for a resource owned by another user', async ({ request }) => { /* tenancy */ });
});
```

See [16-testing/api-testing.md](../../16-testing/api-testing.md) for the
full harness this belongs in.

## Related

- [05-apis/rest-api-design.md](../../05-apis/rest-api-design.md)
- [05-apis/error-format.md](../../05-apis/error-format.md)
- [19-reusable-patterns/api/shared-schemas.md](../../19-reusable-patterns/api/shared-schemas.md)
