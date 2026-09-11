# Authentication (backend)

## What is it?

Establishing *who* is making the request. Authorization (what they may do)
is separate: [authorization.md](authorization.md).

## Recommended approach: JWT access token + httpOnly refresh cookie

```text
POST /auth/login  { email, password }
   → verify bcrypt hash
   → access token (JWT, 15 min, in response body; client keeps it in memory)
   → refresh token (random, 7-30 days, httpOnly Secure SameSite cookie; hash stored in DB)

Every request:  Authorization: Bearer <access>   → authenticate middleware → req.user

POST /auth/refresh   (cookie)  → rotate refresh token, issue new access token
POST /auth/logout    (cookie)  → revoke refresh token in DB, clear cookie
```

Why this shape:

- Access tokens are short-lived and stateless: no DB hit per request. Permission keys and display name ride inside the payload so authorization is an array check.
- Refresh tokens are long-lived and *stateful* (stored hashed), so logout and account deactivation actually end sessions.
- httpOnly cookie for refresh keeps it away from JavaScript (XSS); the access token in memory is lost on reload and silently refreshed.

### Access token payload

```ts
type AccessTokenPayload = {
  sub: string;              // user id
  email: string;
  name: string;             // for audit rows without a lookup
  permissionKeys: string[]; // resolved at login/refresh
  iat: number; exp: number;
};
```

A permission change takes effect at the next refresh (bounded by the access
TTL). Acceptable when roles rarely change; if instant revocation is needed,
add a per-user `tokenVersion` checked on refresh, or shorten the TTL.

### Passwords

- `bcrypt` cost 12 (or `argon2id`). Never store plaintext or reversible.
- Minimum length 12; no composition rules; check against a breached-password list if the product warrants it.
- Reset via a random 32-byte token, stored **hashed**, single-use, 1-hour expiry, sent as a link. The response to "forgot password" is identical whether or not the email exists.

### Session lifecycle

| Event | Action |
| --- | --- |
| Login | Insert refresh token (hash, userId, expiresAt, userAgent). |
| Refresh | Verify cookie against hash; **rotate** (delete old, insert new); if the presented token was already rotated, revoke the whole family (reuse detection). |
| Logout | Delete that refresh token; clear cookie. |
| Password change / deactivation | Delete all of the user's refresh tokens. |
| Expiry | Cron or lazy deletion of expired rows. |

### Cookie settings

```ts
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',          // 'none' only if the API and web are on different sites, then also Secure
  path: '/auth',            // only sent to auth routes
  maxAge: 30 * 24 * 3600 * 1000,
});
```

## Alternative: server sessions

A `sessions` table + opaque session id cookie. Simpler revocation, one DB
read per request. Prefer it for server-rendered apps or when the API and web
are same-site and there is no mobile client. See
[15-security/sessions.md](../15-security/sessions.md).

## Bad example

- Refresh token in `localStorage`.
- Access token TTL of 30 days with no refresh flow (a leaked token is valid for a month).
- Storing the raw refresh token in the database.
- `jwt.verify` without checking `alg` (use a library that pins HS256/RS256).
- Different error messages for "no such user" and "wrong password".

## Production considerations

- Rate limit `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` per IP and per email.
- Bot protection (Turnstile) on login and signup when abuse appears; use the always-pass test key in `NODE_ENV=test`.
- Secrets ≥ 32 random bytes, different for access and refresh, rotated with a grace period.
- Log login success/failure with user id and IP (never the password).

## Checklist

- [ ] Access token short-lived, in memory on the client.
- [ ] Refresh token random, hashed at rest, httpOnly cookie, rotated on use.
- [ ] Logout and deactivation revoke server-side.
- [ ] bcrypt/argon2 hashing; reset tokens hashed and single-use.
- [ ] Uniform error for bad credentials; uniform response for forgot-password.
- [ ] Auth endpoints rate-limited.

## Related

- [15-security/jwt.md](../15-security/jwt.md), [15-security/sessions.md](../15-security/sessions.md)
- [10-frontend/api-integration.md](../10-frontend/api-integration.md) (client-side refresh flow)
