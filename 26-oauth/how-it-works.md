# How the OAuth flow works

## What is it?

The authorization code flow: the user is sent to the provider, approves, and
comes back with a short-lived **code** that your *server* exchanges for
tokens over a back channel.

## The flow

```text
Browser                    Your server                  Provider
   │  GET /auth/google           │                          │
   ├────────────────────────────>│                          │
   │                             │ generate state + verifier│
   │                             │ store both in cookies    │
   │  302 to provider ───────────┤                          │
   ├─────────────────────────────┼─────────────────────────>│
   │                             │           user signs in, consents
   │  302 back with ?code&state  │                          │
   │<────────────────────────────┼──────────────────────────┤
   │  GET /auth/google/callback  │                          │
   ├────────────────────────────>│                          │
   │                             │ state matches cookie?    │
   │                             │ POST code + verifier ───>│  (back channel, TLS,
   │                             │<─── id_token, access ────┤   client secret here)
   │                             │ read claims → find/create user
   │  Set-Cookie: refresh_token  │                          │
   │  302 to the app ────────────┤                          │
```

The code is useless on its own. Exchanging it requires the client secret
(confidential clients) or the PKCE verifier (public clients) — and you should
send both.

## Why each moving part exists

| Part | Attack it prevents | What happens without it |
| --- | --- | --- |
| **`state`** | CSRF on the callback | An attacker completes a flow with *their* provider account and tricks your user's browser into hitting the callback, silently linking or logging the victim into the attacker's account |
| **PKCE** (`code_verifier` / `code_challenge`) | Authorization code interception | A code leaked through a redirect, log, or referrer can be redeemed by whoever holds it |
| **`nonce`** (OIDC) | ID token replay | An ID token captured from one session can be injected into another |
| **Exact redirect URI** | Code exfiltration via open redirect | The provider happily sends the code to an attacker-controlled path on your domain |
| **Back-channel exchange** | Token exposure | Tokens in the URL end up in browser history, server logs, and `Referer` headers |

## PKCE in three lines

```text
code_verifier   = 43–128 random characters              (kept server-side, in a cookie)
code_challenge  = base64url(sha256(code_verifier))      (sent in the authorize URL)
token request   = code + code_verifier                  (provider re-hashes and compares)
```

Whoever steals the code cannot use it without the verifier, which never
travelled over the front channel.

Use `S256`, never `plain`. Arctic does this for you.

## What comes back

```json
{
  "access_token": "ya29.…",        // for calling the provider's APIs
  "expires_in": 3599,
  "refresh_token": "1//0e…",       // only if you asked for offline access
  "id_token": "eyJhbGciOi…",       // OIDC only: who the user is
  "scope": "openid email profile"
}
```

The **ID token** is the one that matters for login. Decoded, it carries:

```json
{
  "iss": "https://accounts.google.com",
  "aud": "your-client-id.apps.googleusercontent.com",
  "sub": "110169484474386276334",     // stable, provider-unique user id
  "email": "user@example.com",
  "email_verified": true,
  "name": "A User",
  "picture": "https://…",
  "nonce": "…",
  "exp": 1757761234
}
```

**`sub` is the identity.** It never changes. The email can change, the name
can change, the picture certainly will. Store `sub` as the link between your
user and the provider ([account-linking.md](account-linking.md)).

## Verifying the ID token

Two cases, and the distinction matters:

| Where the token came from | What you must do |
| --- | --- |
| **Your server's own back-channel call** to the provider's token endpoint, over TLS | Decoding is sufficient. The TLS connection to a known endpoint already authenticates the source. Arctic's `decodeIdToken` is designed for exactly this. |
| **Anywhere else** — passed up from a client, received in a front-channel redirect, read from a queue | Full verification: fetch the provider's JWKS, verify the signature, then check `iss`, `aud`, `exp`, and `nonce`. Use `jose`. |

Getting this backwards in the second case is a complete authentication
bypass: an unverified JWT is a JSON object the attacker wrote.

## Access tokens, refresh tokens, and what to keep

Most login integrations should keep **none** of the provider's tokens.

| You need | Keep |
| --- | --- |
| Login only | Nothing. Read the claims, mint your session, discard. |
| Call the provider's API while the user is present | The access token, in the session, until it expires |
| Call the provider's API when the user is away (background sync) | The refresh token, **encrypted at rest**, plus a plan for revocation |

Storing a refresh token you do not use is pure liability: it is a long-lived
credential to someone else's account, sitting in your database.

## Other grant types

| Grant | Use |
| --- | --- |
| **Authorization code + PKCE** | Everything user-facing. This page. |
| **Client credentials** | Machine-to-machine, no user involved. Your service calling another service. |
| **Device code** | CLIs and TVs where there is no browser to redirect |
| **Implicit** | Never. Removed in OAuth 2.1. |
| **Resource owner password credentials** | Never. It requires the user to give your app their provider password. |

## Related

- [security.md](security.md)
- [implementation.md](implementation.md)
- [15-security/jwt.md](../15-security/jwt.md)
