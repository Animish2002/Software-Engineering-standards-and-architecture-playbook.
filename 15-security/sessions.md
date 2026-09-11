# Sessions and refresh tokens

## Two designs

| | Server sessions | Access JWT + refresh token |
| --- | --- | --- |
| State per request | Session lookup (DB/KV) | None (JWT verify) |
| Revocation | Instant (delete row) | ≤ access TTL, refresh instant |
| Client | One httpOnly cookie | Access in memory + refresh httpOnly cookie |
| Best for | Same-site server-rendered or SPA-only apps; simplest correct option | SPA + separate API host; mobile clients; multiple services verifying |

Either is fine. The rules below apply to whichever token is long-lived
(the session id or the refresh token).

## Long-lived token rules

- **Random**: ≥ 32 bytes from `crypto.randomBytes`/`crypto.getRandomValues`, base64url.
- **Hashed at rest** (SHA-256); the raw value exists only in the cookie.
- **Bound to a user**, with `expiresAt`, `createdAt`, optional `userAgent`/`ip` for the "active sessions" UI.
- **Rotated on use** (refresh tokens): old one deleted, new one issued. Presenting an already-rotated token = theft signal → revoke the whole family.
- **Revoked on** logout, password change, deactivation, admin action.
- **Expired rows cleaned** periodically.
- **Absolute lifetime** (e.g., 30 days) plus idle timeout if the product needs it.

## Cookie settings

```ts
{
  httpOnly: true,                // no JS access
  secure: true,                  // HTTPS only (false only on localhost dev)
  sameSite: 'lax',               // blocks cross-site POSTs; 'strict' breaks links from email; 'none' only for cross-site with CSRF defence
  path: '/auth',                 // refresh cookie only sent to auth endpoints
  maxAge: 30 * 24 * 3600 * 1000,
  domain: undefined,             // host-only unless subdomains must share it
}
```

Cookie name prefixes (`__Host-refresh`) enforce `secure` + host-only at
the browser level; use them when the API is on its own host.

## Session fixation and hijacking

- Issue a new session id on login (never reuse a pre-login id).
- Rotate refresh tokens.
- Bind nothing to IP (mobile users change IPs); optionally alert on user-agent changes.

## "Active sessions" feature

List rows per user (device, last used); allow revoking individual ones.
Cheap with a sessions/refresh table; impossible with pure JWTs.

## Related

- [jwt.md](jwt.md)
- [csrf.md](csrf.md)
- [http-headers.md](http-headers.md)
