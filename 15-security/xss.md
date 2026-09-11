# XSS (cross-site scripting)

## What is it?

Attacker-controlled content executes as script in your page. With it, the
attacker reads anything the page can (tokens in memory, `localStorage`,
DOM), makes requests as the user, and deforms the UI.

## Controls

| Control | Detail |
| --- | --- |
| **React's default escaping** | `{value}` in JSX is text, never HTML. Keep it that way. |
| **No `dangerouslySetInnerHTML`** without sanitising | `DOMPurify.sanitize(html)` with a strict allow-list, and only where HTML rendering is a feature (rich text, markdown). |
| **URL validation** | `href`/`src` from user data: allow only `https?:`, `mailto:`, or relative; reject `javascript:`/`data:` (except known-safe image data URLs you generate). |
| **Content Security Policy** | On the frontend host: `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; connect-src 'self' https://api… https://<storage>; img-src 'self' data: blob: https://<storage>; style-src 'self' 'unsafe-inline'` (Tailwind/Radix inject inline styles; drop `'unsafe-inline'` if you can use nonces). No inline scripts (Vite doesn't need them). |
| **Tokens out of reach** | Access token in memory; refresh in httpOnly cookie. XSS can still *use* the token while the page is open, but can't exfiltrate a long-lived credential. |
| **Output encoding on the server** | The API returns JSON with `Content-Type: application/json`; never reflects input into HTML. If the API ever renders HTML (emails, share pages), escape every interpolated value. |
| **File names and metadata** | Rendered as text; download `Content-Disposition` filenames sanitised (`encodeURIComponent`, strip quotes/newlines). |
| **Uploaded content** | Served from object storage on a separate origin (R2 domain) so an uploaded HTML/SVG can't run on your origin; set `Content-Disposition: attachment` for untrusted types; never serve user files from the app origin. |
| **Third-party scripts** | Minimise; each one is a full-trust dependency inside your page. |
| **Dependencies** | Audit; a compromised npm package is XSS by another route. |

## Email templates

Server-rendered HTML emails interpolate names and links: escape values,
build links from configured origins (`CORS_ORIGIN`), never from request
headers (`Host` injection).

## Testing

- Try `<img src=x onerror=alert(1)>` as a file name, folder name, user name, share message.
- Check every `dangerouslySetInnerHTML` in the codebase (`grep`) has a sanitiser and a reason.
- Validate the CSP with the browser console (violations are logged) and a report endpoint if the product is public.

## Related

- [http-headers.md](http-headers.md)
- [10-frontend/security.md](../10-frontend/security.md)
