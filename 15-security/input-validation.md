# Input validation and output encoding (security view)

Mechanics: [02-backend/validation.md](../02-backend/validation.md). This
page is why it's a security control and what to add for that purpose.

## Validation as security

| Threat | Validation control |
| --- | --- |
| Injection (SQL, command, header) | Types/formats enforced; lengths bounded; then parameterised queries |
| Mass assignment | Schemas whitelist fields; `ownerId`, `role`, `isAdmin` never accepted from the body |
| DoS via payload | Body size limit at the parser; array `max()`; string `max()`; pagination caps; recursion depth in nested input |
| Type confusion | `z.string().uuid()` for ids so `'1 OR 1=1'` or `{ $gt: '' }` never reaches a query |
| Enumeration | Uniform 404/200 responses; ids opaque |
| Unicode tricks | `trim()`, normalise (`NFC`), reject control characters in names; consider homoglyphs for usernames |
| File upload abuse | Validate `mimeType`, `size` against limits; server-chosen storage keys; content-type constraint in the presigned URL; never trust the extension |
| Open redirect | `returnTo` must be a relative path (`/^\/(?!\/)/`), never a full URL |
| Prototype pollution | Zod objects strip unknown keys; don't deep-merge raw input into objects |

## Output encoding

- JSON responses: `res.json` encodes; never hand-build JSON strings.
- HTML (emails, share pages): escape every value with a template engine's auto-escape or a small `escapeHtml`.
- Headers: strip CR/LF; `encodeURIComponent` filenames in `Content-Disposition`.
- Logs: structured fields, never interpolated into a message string (log injection, and easier redaction).
- CSV exports: prefix cells starting with `=`, `+`, `-`, `@` with `'` to prevent formula injection in spreadsheets.

## Where

- HTTP boundary (body/query/params/headers).
- Queue messages and webhook payloads (an older producer or a third party).
- Environment/config at boot.
- Not repeatedly inside services (trust the boundary; the type system carries it).

## Related

- [sql-injection.md](sql-injection.md)
- [xss.md](xss.md)
- [05-apis/request-validation.md](../05-apis/request-validation.md)
