# OAuth checklist

Run this when adding a provider, and before any OAuth login goes to
production.

## Registration

- [ ] Redirect URI registered exactly, for every environment.
- [ ] Redirect URI points at the API route, not the frontend origin.
- [ ] Scopes are the minimum for login (`openid profile email`), nothing broader.
- [ ] Client secret in the secret store, not in `.env` committed anywhere.
- [ ] Secret expiry recorded and scheduled (Microsoft Entra caps at 24 months).
- [ ] Google consent screen moved out of Testing.
- [ ] Microsoft tenant setting matches the intended audience (`organizations`, not `common`, for B2B).

## Flow

- [ ] Authorization code flow with PKCE (S256).
- [ ] `state` generated server-side, stored in an httpOnly cookie, compared on callback.
- [ ] `nonce` sent and checked where supported.
- [ ] Temporary cookies: `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/auth'`, ≤ 10 minutes.
- [ ] Temporary cookies cleared on every callback path, including errors.
- [ ] `returnTo` validated as a relative path.
- [ ] `OAuth2RequestError` and `ArcticFetchError` handled distinctly and shown as a friendly login error.

## Identity

- [ ] Account keyed on the provider's `sub` (or numeric id), never on email.
- [ ] `oauth_accounts` has a unique index on `(provider, provider_user_id)`.
- [ ] Unverified provider email never links to or creates an account.
- [ ] Link-or-create runs in one transaction.
- [ ] `users.passwordHash` is nullable.
- [ ] ID token verified with JWKS unless it came from your own back-channel call.
- [ ] Deactivated accounts are rejected after the exchange.

## Session

- [ ] The callback issues *your* session, using the same code path as password login.
- [ ] A new session is issued; no anonymous session is upgraded.
- [ ] Provider tokens discarded unless the product calls the provider's API.
- [ ] Any stored provider refresh token is encrypted at rest and revoked on unlink.

## Account management

- [ ] Settings page lists linked providers with link dates.
- [ ] Unlink is blocked when it would remove the last credential.
- [ ] Link and unlink are audited and emailed to the user.
- [ ] Profile fields are not overwritten from the provider on every login.

## Operations

- [ ] Callback route rate-limited.
- [ ] `auth.oauth.success` / `auth.oauth.rejected` logged with the provider; no codes, states, or tokens in logs.
- [ ] Alert on a spike in rejected callbacks.
- [ ] A provider outage shows a clear message and, if one exists, the password path.
- [ ] Tested: cancel at the consent screen, expired code, replayed code, mismatched state, deactivated user.

## Related

- [README.md](README.md)
- [security.md](security.md)
- [21-checklists/security-checklist.md](../21-checklists/security-checklist.md)
