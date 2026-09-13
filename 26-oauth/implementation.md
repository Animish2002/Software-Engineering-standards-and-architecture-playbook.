# Implementation

End to end: two routes, three temporary cookies, one new table. Express
shown; the Hono version differs only in how cookies and redirects are
written ([08-hono/](../08-hono/)).

## 1. The table

A user has many provider identities. The provider's `sub` is the link.

```ts
// db/schema/oauth-accounts.ts
export const oauthProvider = pgEnum('oauth_provider', ['google', 'microsoft', 'github']);

export const oauthAccounts = pgTable('oauth_accounts', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: oauthProvider('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),      // the `sub` claim — never the email
  email: text('email'),                                    // as seen at link time, for support
  ...timestamps,
}, (t) => [
  uniqueIndex('uq_oauth_provider_user').on(t.provider, t.providerUserId),
  index('idx_oauth_user').on(t.userId),
]);
```

The unique index is the whole integrity story: one provider identity maps to
exactly one user, enforced by the database rather than by a check you might
forget.

Also make `users.passwordHash` nullable — an OAuth-only user has no password.

## 2. Provider configuration

```ts
// auth/oauth/providers.ts
import { Google, MicrosoftEntraId, GitHub } from 'arctic';

export const providers = {
  google: new Google(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    `${config.API_URL}/auth/google/callback`,
  ),
  microsoft: new MicrosoftEntraId(
    config.MICROSOFT_TENANT,                     // 'common', 'organizations', or a tenant UUID
    config.MICROSOFT_CLIENT_ID,
    config.MICROSOFT_CLIENT_SECRET,
    `${config.API_URL}/auth/microsoft/callback`,
  ),
} as const;

export const scopes = {
  google: ['openid', 'profile', 'email'],
  microsoft: ['openid', 'profile', 'email', 'User.Read'],
} as const;
```

The redirect URI here must match what is registered at the provider
character for character, including the scheme and any trailing slash.

## 3. The start route

```ts
// auth/oauth/routes.ts
import { generateState, generateCodeVerifier } from 'arctic';

const TEMP_COOKIE = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax' as const,      // must be 'lax', not 'strict': the callback is a cross-site redirect
  path: '/auth',
  maxAge: 10 * 60 * 1000,
};

router.get('/auth/:provider', (req, res) => {
  const provider = assertKnownProvider(req.params.provider);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = providers[provider].createAuthorizationURL(state, codeVerifier, [...scopes[provider]]);

  res.cookie('oauth_state', state, TEMP_COOKIE);
  res.cookie('oauth_verifier', codeVerifier, TEMP_COOKIE);
  res.cookie('oauth_return_to', safeReturnTo(req.query.returnTo), TEMP_COOKIE);

  res.redirect(url.toString());
});
```

`sameSite: 'strict'` is the mistake to avoid here. The user arrives at the
callback via a redirect from the provider's site, so a strict cookie is not
sent and every login fails with "state mismatch".

```ts
// Only relative, single-slash paths come back. Everything else goes to the default.
function safeReturnTo(value: unknown) {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : '/dashboard';
}
```

## 4. The callback route

```ts
import { decodeIdToken, OAuth2RequestError, ArcticFetchError } from 'arctic';

router.get('/auth/:provider/callback', async (req, res) => {
  const provider = assertKnownProvider(req.params.provider);
  const { code, state, error: providerError } = req.query;
  const { oauth_state: storedState, oauth_verifier: verifier, oauth_return_to: returnTo = '/dashboard' } = req.cookies;

  clearTempCookies(res);                                  // always, on every path below

  if (providerError) return res.redirect(`/login?error=${providerError === 'access_denied' ? 'cancelled' : 'provider'}`);

  if (typeof code !== 'string' || typeof state !== 'string' || !storedState || !verifier || state !== storedState) {
    return res.redirect('/login?error=invalid_request');
  }

  try {
    const tokens = await providers[provider].validateAuthorizationCode(code, verifier);
    const identity = await readIdentity(provider, tokens);

    if (!identity.emailVerified) return res.redirect('/login?error=email_unverified');

    const user = await linkOrCreateUser(provider, identity);   // account-linking.md
    if (!user.isActive) return res.redirect('/login?error=account_disabled');

    await issueSession(res, user);                             // the existing password-login session code
    req.log.info({ userId: user.id, provider }, 'auth.oauth.success');
    return res.redirect(returnTo);
  } catch (error) {
    if (error instanceof OAuth2RequestError) {
      req.log.warn({ provider, code: error.code }, 'auth.oauth.rejected');   // bad/expired/reused code
      return res.redirect('/login?error=invalid_request');
    }
    if (error instanceof ArcticFetchError) {
      req.log.error({ provider, err: error }, 'auth.oauth.unreachable');     // provider down
      return res.redirect('/login?error=provider_unavailable');
    }
    throw error;
  }
});
```

`issueSession` is the same function the password login calls: it mints the
access token, inserts the hashed refresh token, and sets the refresh cookie
([02-backend/authentication.md](../02-backend/authentication.md)). Nothing
downstream of this point knows or cares how the user proved who they were.

## 5. Reading the identity

```ts
// auth/oauth/identity.ts
type Identity = { providerUserId: string; email: string; emailVerified: boolean; name: string };

export async function readIdentity(provider: Provider, tokens: OAuth2Tokens): Promise<Identity> {
  if (provider === 'github') {
    // Plain OAuth 2.0: no ID token. Fetch the user, then the (separate) verified-emails endpoint.
    return readGitHubIdentity(tokens.accessToken());
  }

  // OIDC: the claims came back over TLS from the token endpoint, so decoding is sufficient.
  const claims = decodeIdToken(tokens.idToken()) as Record<string, unknown>;

  return {
    providerUserId: String(claims.sub),
    email: String(claims.email ?? ''),
    emailVerified: provider === 'microsoft'
      ? true                                  // Entra ID does not emit email_verified; see providers.md
      : claims.email_verified === true,
    name: String(claims.name ?? claims.email ?? 'User'),
  };
}
```

If you ever receive an ID token from anywhere other than your own
back-channel call, verify it properly with `jose` instead of decoding
([how-it-works.md](how-it-works.md)).

## 6. Frontend

There is no SDK and no popup. A link:

```tsx
<a href={`${API_URL}/auth/google?returnTo=${encodeURIComponent(location.pathname)}`}>
  Continue with Google
</a>
```

A full-page navigation, not `fetch` — the browser must follow redirects to
the provider's domain, and the cookies set along the way must be first-party.
The callback lands on the API, which sets the session cookie and redirects
into the app.

## Bad example

```ts
// Avoid
router.get('/auth/google/callback', async (req, res) => {
  const tokens = await google.validateAuthorizationCode(req.query.code);   // no verifier
  const claims = jwt.decode(tokens.idToken());
  let user = await findByEmail(claims.email);                              // email as identity
  if (!user) user = await createUser({ email: claims.email });             // no verification check
  res.redirect(req.query.returnTo);                                        // open redirect
});
```

No `state` check (CSRF), no PKCE, identity keyed on a mutable and possibly
unverified email, and an attacker-supplied redirect target.

## Common mistakes

- `sameSite: 'strict'` on the state cookie, breaking every login.
- Not clearing the temporary cookies on the error paths, so a stale `state` breaks the next attempt.
- Redirecting to `req.query.returnTo` without validating it — a textbook open redirect.
- Keying the account on `email` instead of `sub`.
- Letting an exception in the callback render a stack trace instead of returning the user to the login page.
- Registering the callback URL on the frontend origin when the route lives on the API.
- Forgetting to make `passwordHash` nullable, so creating an OAuth user violates a constraint.

## Production considerations

- Register every environment's redirect URI, including preview deployments if you use them. Wildcards are usually not permitted, which is a feature.
- Client secrets go in the secret store and are rotated like any other ([15-security/secrets.md](../15-security/secrets.md)).
- Rate-limit the callback route: it performs an outbound HTTP call and a database write per hit.
- Log `auth.oauth.success` and `auth.oauth.rejected` with the provider. A spike in rejections is a broken configuration or an attack.
- Provider outages: the error page should say the provider is unavailable and offer the password path if one exists.

## Related

- [account-linking.md](account-linking.md)
- [security.md](security.md)
- [providers.md](providers.md)
