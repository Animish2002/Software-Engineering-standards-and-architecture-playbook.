# Frontend security

The API enforces; the frontend must not undermine it.

## Tokens

- Access token in **memory** only (module variable / store), refreshed via the httpOnly cookie. Never `localStorage`/`sessionStorage` (readable by any XSS).
- Clear cache and token on logout and on `401` after a failed refresh.

## XSS

- React escapes by default. `dangerouslySetInnerHTML` only with sanitised HTML (`DOMPurify`) and a documented reason.
- Never build URLs from user input without validation (`javascript:` in `href`); allow only `http(s):`/`mailto:`/relative.
- Markdown rendering: a sanitising renderer.
- CSP on the frontend host (`_headers` on Pages): `script-src 'self'`, `connect-src` limited to the API and storage endpoints, no inline scripts (Vite builds don't need them).

## Data exposure

- Hide UI by permission (`hasPermission`) but never rely on it; the API returns 403/404 regardless.
- Don't put other users' data in client state for "later"; fetch what the screen needs.
- `VITE_*` env is public: URLs and public keys only.

## Dependencies

- `npm audit` in CI; Dependabot; review what a UI package pulls in.
- Lockfile committed.

## Uploads and downloads

- Presigned URLs from the API; the client never holds storage credentials.
- Validate file type/size client-side for UX; the API enforces.
- Downloads via presigned GET; `Content-Disposition` set by the storage/API, not derived from user-controlled names without sanitising.

## Clickjacking and framing

`X-Frame-Options: DENY` / CSP `frame-ancestors 'none'` unless embedding is a feature.

## Native dialogs

None (`alert`/`confirm`/`prompt`, `<input webkitdirectory>` prompts, extra `beforeunload`). Beyond UX, native prompts train users to click through browser chrome. The single sanctioned exception is the upload-in-progress `beforeunload` guard.

## Related

- [15-security/xss.md](../15-security/xss.md)
- [15-security/jwt.md](../15-security/jwt.md)
- [09-cloudflare/deployment.md](../09-cloudflare/deployment.md) (`_headers`)
