# OAuth security

The controls, the attacks they stop, and how each one fails in practice.

## The required set

| Control | Implementation | Fails as |
| --- | --- | --- |
| **`state`** | Random value in an httpOnly cookie; compared on callback; single-use | Login CSRF: the victim is silently signed into the attacker's account, or the attacker's provider identity is linked to the victim's account |
| **PKCE (S256)** | `generateCodeVerifier()`, verifier in a cookie, sent on exchange | A leaked code is redeemable by anyone |
| **`nonce`** (OIDC) | Sent on authorize, compared against the ID token claim | ID token replay |
| **Exact redirect URI** | Registered per environment at the provider; no wildcards | Code exfiltration |
| **Validated `returnTo`** | Relative paths only | Open redirect |
| **HTTPS everywhere** | Including local development if the provider insists | Everything above |

## `state` done correctly

```ts
// Recommended — server-generated, httpOnly, single-use, constant-time comparison
const state = generateState();
res.cookie('oauth_state', state, { httpOnly: true, secure: config.isProd, sameSite: 'lax', path: '/auth', maxAge: 600_000 });

// on callback
clearTempCookies(res);                       // before any branch — the value is spent either way
if (!storedState || !timingSafeEqualStrings(state, storedState)) return res.redirect('/login?error=invalid_request');
```

```ts
// Avoid
const state = req.query.returnTo;            // not random, attacker-chosen
sessionStorage.setItem('state', state);      // readable by script, and not sent to the server
if (state) { /* present, but never compared */ }
```

A `state` you generate but never compare is the most common way this is got
wrong — it looks correct in review because the parameter is there.

## PKCE is not optional for confidential clients

The old guidance was that PKCE is for public clients that cannot hold a
secret. Current guidance (OAuth 2.1) is that every authorization code flow
uses PKCE, because it also defends against code injection where the secret
is intact but the code was intercepted.

Arctic's provider classes require a verifier, which removes the choice.

## Redirect URI and open redirect

The provider only sends the code to a registered URI, so that side is
constrained. The exposure is what *your* callback does next:

```ts
// Avoid — anything can be in there
res.redirect(req.query.returnTo);
res.redirect(req.cookies.oauth_return_to);          // no better; the cookie came from query input

// Recommended — relative, single-slash, allowlisted prefix
const returnTo = /^\/(?!\/)[\w\-/]*$/.test(raw) ? raw : '/dashboard';
```

`//evil.com` is a protocol-relative URL that browsers treat as absolute,
which is why the second character has to be checked.

## Handling tokens

| Token | Where it belongs |
| --- | --- |
| Provider **ID token** | Read it, use the claims, discard it. Never store it, never send it to the browser. |
| Provider **access token** | Only if you call the provider's API. Server-side, in the session record, never in `localStorage`. |
| Provider **refresh token** | Only for background access. Encrypted at rest with a key from the secret store, and revoked when the user unlinks. |
| **Your** access + refresh tokens | As [02-backend/authentication.md](../02-backend/authentication.md) already specifies |

Never put a provider token in a URL, a log line, an error message, or a
frontend-visible response.

## ID token verification

Covered in [how-it-works.md](how-it-works.md), and worth repeating because
getting it wrong is an authentication bypass: decoding without verifying is
acceptable **only** for a token your own server just received over TLS from
the provider's token endpoint. In every other case verify the signature
against the provider's JWKS and check `iss`, `aud`, `exp`, and `nonce`.

```ts
// Required when the token did not come from your own back-channel call
import * as jose from 'jose';

const jwks = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const { payload } = await jose.jwtVerify(idToken, jwks, {
  issuer: 'https://accounts.google.com',
  audience: config.GOOGLE_CLIENT_ID,
});
```

Omitting `audience` is the subtle failure: without it you accept ID tokens
issued to *any* application by that provider, so anyone with their own Google
app can mint a token for your system.

## Session fixation

Issue a new session after the OAuth callback; do not upgrade whatever
anonymous session already existed. Rotating on privilege change is the same
rule as after a password login.

## Rate limiting and abuse

- The start route: cheap, but rate-limit anyway to prevent redirect spam.
- The callback route: an outbound HTTP call and a database write per request. Rate-limit per IP.
- Repeated `invalid_request` outcomes from one IP are worth an alert — that is someone probing.

## Logging

```ts
req.log.info({ userId, provider }, 'auth.oauth.success');
req.log.warn({ provider, reason: 'state_mismatch' }, 'auth.oauth.rejected');
```

Log the outcome, the provider, and the user id. Never the code, the state,
the tokens, or the full callback URL — that URL contains the code
([00-engineering-principles/logging.md](../00-engineering-principles/logging.md)).

## Checklist

- [ ] `state`: random, httpOnly cookie, compared, cleared on every path.
- [ ] PKCE with S256 on every provider.
- [ ] `nonce` sent and checked where the provider supports it.
- [ ] Redirect URIs registered exactly, per environment.
- [ ] `returnTo` validated as a relative path.
- [ ] Temporary cookies are `sameSite: 'lax'`, `path: '/auth'`, ~10 minute lifetime.
- [ ] ID tokens verified with JWKS + `iss`/`aud`/`exp`/`nonce` unless from your own back-channel call.
- [ ] Provider tokens discarded unless needed; refresh tokens encrypted at rest.
- [ ] New session issued on callback.
- [ ] Callback rate-limited; outcomes logged without secrets.
- [ ] Client secrets in the secret store, rotation scheduled (Entra expires them).

## Related

- [how-it-works.md](how-it-works.md)
- [15-security/jwt.md](../15-security/jwt.md)
- [15-security/csrf.md](../15-security/csrf.md)
- [15-security/secrets.md](../15-security/secrets.md)
