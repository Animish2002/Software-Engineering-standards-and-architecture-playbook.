# 26 — OAuth and social login

Letting users sign in with Google, Microsoft, GitHub, or a corporate identity
provider, instead of (or alongside) a password.

The default for this stack: **the authorization code flow with PKCE, driven
by [Arctic](https://arcticjs.dev) — a thin, typed OAuth client — terminating
in the same session your password login issues.** OAuth replaces the
*credential check*, not your session system.

| Document | Topic |
| --- | --- |
| [how-it-works.md](how-it-works.md) | The authorization code flow, PKCE, and what OIDC adds on top of OAuth 2.0. |
| [choosing-a-library.md](choosing-a-library.md) | Arctic vs openid-client vs Better Auth vs Auth.js vs Passport vs hosted. |
| [implementation.md](implementation.md) | The two routes, end to end, with cookies and session issuance. |
| [providers.md](providers.md) | Google, Microsoft Entra ID, GitHub: console setup, scopes, claims, quirks. |
| [account-linking.md](account-linking.md) | Same person, two providers; the email-collision decision. |
| [security.md](security.md) | State, PKCE, nonce, redirect URIs, token handling, the classic vulnerabilities. |
| [oauth-checklist.md](oauth-checklist.md) | The one-page checklist. |

## Principles

1. **OAuth gives you an identity, not a session.** The flow ends by minting
   *your* access and refresh tokens ([02-backend/authentication.md](../02-backend/authentication.md)).
   The provider's tokens are for calling the provider's APIs, and usually you
   never need them again.
2. **Authorization code with PKCE, always.** Implicit flow is dead. PKCE is
   not just for mobile any more; it is the default for confidential clients too.
3. **`state` and PKCE are separate controls** for separate attacks. You need
   both.
4. **Never trust an email as proof of identity** without `email_verified`, and
   never link accounts on an unverified email.
5. **Redirect URIs are exact-match allowlisted** at the provider. Every open
   redirect bug in an OAuth flow starts with a loose one.
6. **The provider is a dependency.** It has outages, it changes consent
   screens, and it can suspend your app. Do not delete the password path
   unless you have decided, deliberately, to make the provider a hard
   requirement.

## When should I use it?

- Your users already have Google or Microsoft accounts and you would rather not store passwords.
- A business customer requires SSO for their employees.
- You need to call a provider's API on the user's behalf (Drive, Calendar, repositories). This is OAuth's actual purpose; login is the special case.

## When should I NOT use it?

- An internal tool with a fixed, admin-created user list. Passwords plus MFA are less machinery ([15-security/authentication.md](../15-security/authentication.md)).
- As your *only* login for a consumer product, unless you accept losing every user whose provider account is disabled.
- To avoid building sessions. You still need sessions. OAuth is upstream of them.

## OAuth vs OIDC, in one line

OAuth 2.0 authorises *access to an API*. OpenID Connect is a thin layer on
top that adds an **ID token** — a signed JWT asserting *who the user is*.
Login needs OIDC. Google and Microsoft Entra ID are OIDC providers; GitHub is
plain OAuth 2.0, so you fetch the user from its API instead.

## Related

- [02-backend/authentication.md](../02-backend/authentication.md)
- [15-security/authentication.md](../15-security/authentication.md)
- [15-security/jwt.md](../15-security/jwt.md)
