# Authentication

Backend implementation of the JWT + refresh-cookie flow is in
[02-backend/authentication.md](../02-backend/authentication.md). This page
covers the security properties.

## Passwords

| Control | Standard |
| --- | --- |
| Hashing | `bcrypt` cost 12, or `argon2id` (memory 64 MB, iterations 3). Never SHA-*/MD5, never reversible. |
| Length | Minimum 12; maximum ~128 (bcrypt truncates at 72 bytes; reject longer or pre-hash). No composition rules. |
| Breach check | Optional: k-anonymity check against Have I Been Pwned for public-facing signups. |
| Comparison | Library `compare`; constant-time. |
| Errors | Same message and timing for "no such user" and "wrong password" (run the hash compare against a dummy hash when the user doesn't exist). |
| Storage | Only the hash; never log or return it; select it only in the one repository function that verifies. |

## Credential flows

| Flow | Rules |
| --- | --- |
| Login | Rate-limited per IP and per account; bot challenge after abuse; log success/failure with user id + IP. |
| Password reset | Random 32-byte token, **hashed** at rest, 1-hour expiry, single-use, invalidates previous tokens; response identical whether or not the email exists; email send failures swallowed and logged (never change the response). |
| Password change | Requires the current password; revokes all other sessions. |
| Account creation (admin-created) | Temporary password delivered out of band; force change on first login if the product warrants it. |
| Email change | Only by admins in admin-created systems, or with re-authentication + verification of the new address. |
| Logout | Revokes the refresh token server-side; clears the cookie. |
| Deactivation | Blocks login and refresh (`ACCOUNT_DEACTIVATED`); revokes tokens. |

## Multi-factor

Add TOTP (RFC 6238) when the product handles sensitive data or admin
roles: secret stored encrypted, recovery codes hashed, rate-limited
verification, remembered-device cookie optional. Not default for internal
tools; document the decision.

## Bot protection

Turnstile (or equivalent) on login/signup/reset forms once abuse appears;
verify the token server-side; always-pass test key under `NODE_ENV=test`.

## Don't

- Roll your own hashing or token format.
- Return different errors for unknown vs wrong-password.
- Store reset tokens or refresh tokens in plaintext.
- Allow unlimited login attempts.

## Related

- [jwt.md](jwt.md)
- [sessions.md](sessions.md)
- [05-apis/rate-limiting.md](../05-apis/rate-limiting.md)
