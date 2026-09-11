# HTTP security headers and cookies

## API responses (`helmet()` / `secureHeaders()` defaults, plus)

| Header | Value | Purpose |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (set at the edge/CDN too) | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `X-Frame-Options` | `DENY` | Anti-clickjacking (legacy; CSP `frame-ancestors` is the modern one) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak URLs |
| `Cache-Control` | `private, no-store` on authenticated responses | No shared caching of user data |
| `Content-Security-Policy` | Minimal on an API (`default-src 'none'; frame-ancestors 'none'`) | Nothing to execute |
| `Cross-Origin-Resource-Policy` | `same-site` | Block cross-site embedding of API responses |
| `X-Request-Id` | Echoed | Correlation |
| `Server`/`X-Powered-By` | Removed | Less fingerprinting |

## Frontend (static host `_headers`)

```text
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://<storage-host>; connect-src 'self' https://api.example.com https://<storage-host>; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
```

Test the CSP in report-only mode first (`Content-Security-Policy-Report-Only`).

## Cookies

| Attribute | Value | Why |
| --- | --- | --- |
| `HttpOnly` | Always for auth cookies | XSS can't read them |
| `Secure` | Always in production | HTTPS only |
| `SameSite` | `Lax` default; `Strict` for admin-only cookies; `None` only with CSRF defences | CSRF |
| `Path` | Narrowest (`/auth`) | Fewer requests carry it |
| `Domain` | Omit (host-only) unless subdomains must share | Scope |
| `Max-Age`/`Expires` | Explicit | No accidental session-forever |
| `__Host-` prefix | When host-only + Secure + no Domain | Browser-enforced |

## Related

- [xss.md](xss.md)
- [csrf.md](csrf.md)
- [07-express/security.md](../07-express/security.md)
