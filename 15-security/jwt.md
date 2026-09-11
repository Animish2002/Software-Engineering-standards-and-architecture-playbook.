# JWT

## Use JWTs for

Short-lived **access tokens** carrying identity and resolved permission
keys, verified statelessly on every request.

## Don't use JWTs for

- Long-lived sessions (a leaked token is valid until expiry; you can't revoke it without state).
- Refresh tokens (use random opaque tokens stored hashed; revocable).
- Storing sensitive data (the payload is base64, readable by anyone).

## Rules

| Rule | Detail |
| --- | --- |
| Algorithm pinned | `HS256` with a ≥ 32-byte secret for a single issuer/verifier; `RS256`/`ES256` when other services verify. Verify with `algorithms: ['HS256']` explicitly; reject `none`. |
| Short TTL | 15 minutes typical. |
| Claims | `sub` (user id), `iat`, `exp`, plus app claims (`email`, `name`, `permissionKeys`). No secrets, no passwords, no PII beyond what routes need. |
| Issuer/audience | Set `iss`/`aud` and verify them when more than one app shares a secret. |
| Secret management | Separate secrets for access and refresh signing; rotated with a grace period (accept old + new during rotation). |
| Transport | `Authorization: Bearer` header. Never in URLs. |
| Client storage | Memory only. Not `localStorage`. |
| Payload size | Keep small; it rides on every request. Permission keys as short strings are fine; a full user object is not. |
| Clock skew | Allow a few seconds of leeway. |
| Fallbacks | When adding a claim (e.g., `name`), the verifier tolerates tokens issued before it existed until they expire. |

```ts
// lib/jwt.ts
import jwt from 'jsonwebtoken';
export function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m', issuer: 'app-api' });
}
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'], issuer: 'app-api', clockTolerance: 5 }) as AccessTokenPayload;
}
```

On Workers use `jose` (Web Crypto) instead of `jsonwebtoken`.

## Revocation strategies (when needed)

- Short TTL + refresh rotation (default; revocation latency ≤ TTL).
- `tokenVersion` on the user, embedded in the token, checked on refresh (instant for sessions; still ≤ TTL for access).
- Denylist of `jti` in KV/Redis for immediate revocation of specific tokens (adds a lookup per request; only for high-security actions).

## Related

- [sessions.md](sessions.md)
- [02-backend/authentication.md](../02-backend/authentication.md)
