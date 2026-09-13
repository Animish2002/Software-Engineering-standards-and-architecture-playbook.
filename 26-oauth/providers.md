# Provider specifics

The flow is identical everywhere. The differences are in registration, which
claims you get, and which of them you may trust.

## Google

**Register:** Google Cloud Console → APIs & Services → Credentials → Create
credentials → OAuth client ID → Web application. Add every environment's
redirect URI exactly.

| Item | Value |
| --- | --- |
| Scopes for login | `openid`, `profile`, `email` |
| Identity claim | `sub` |
| `email_verified` | Present and trustworthy |
| Workspace domain | `hd` claim — present only for Google Workspace accounts |
| Extra | `picture`, `given_name`, `family_name` |

**Consent screen:** while publishing status is *Testing*, only explicitly
listed test users can sign in and refresh tokens expire after 7 days. Move it
to *In production* before launch. Basic login scopes do not require Google's
verification review; anything touching Drive, Gmail, or Calendar does, and
that review takes weeks. Plan for it.

**Restricting to one Workspace domain:**

```ts
const claims = decodeIdToken(tokens.idToken()) as { hd?: string };
if (claims.hd !== 'yourcompany.com') throw new AppError('DOMAIN_NOT_ALLOWED', 'Use your company account', 403);
```

The `hd` parameter on the authorize URL only pre-fills the account chooser.
It is a hint, not a control — check the claim server-side.

**Refresh tokens** are only issued with `access_token` offline access, and
only on the *first* consent unless you force the prompt:

```ts
const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
url.searchParams.set('access_type', 'offline');
url.searchParams.set('prompt', 'consent');       // otherwise a returning user gets no refresh token
```

Only do this if you actually call Google APIs in the background. For login,
skip both.

## Microsoft Entra ID

**Register:** Microsoft Entra admin center → App registrations → New
registration. Platform: Web. Add redirect URIs.

| Item | Value |
| --- | --- |
| Scopes for login | `openid`, `profile`, `email`, `User.Read` |
| Identity claim | `sub` (pairwise — unique per application *and* user) |
| Tenant-stable ids | `oid` (user object id) + `tid` (tenant id) |
| `email_verified` | **Not emitted** |
| Email location | `email` claim if the account has a mail attribute; otherwise `preferred_username` |

**Tenant selection** is the decision that catches people out:

| `tenant` value | Who can sign in |
| --- | --- |
| `common` | Any work, school, **or personal** Microsoft account |
| `organizations` | Work or school accounts in any tenant |
| `consumers` | Personal Microsoft accounts only |
| A tenant GUID | One specific organisation |

Use `organizations` for a B2B product. `common` lets personal Outlook
accounts into what you may have assumed was a corporate-only application.

**No `email_verified`.** For a work or school account the email is assigned
by the tenant administrator, so treating it as verified is reasonable. For a
personal account reached through `common`, it is not — which is another
reason to avoid `common`.

**Client secrets expire.** Entra caps them at 24 months and the default
suggestion is shorter. An expired secret is a total login outage with a
generic error. Put the expiry date in the calendar, or use certificate
credentials.

**`sub` vs `oid`:** `sub` is pairwise, so the same user has a different `sub`
in each of your applications. That is fine — and good — for a single app.
If two of your applications must recognise the same person, key on
`oid` + `tid` instead.

## GitHub

Plain OAuth 2.0, no OIDC, so there is no ID token.

| Item | Value |
| --- | --- |
| Scopes for login | `read:user`, `user:email` |
| Identity | `id` from `GET /api/user` |
| Email | Often `null` on the user object — it is only the *public* email |

```ts
async function readGitHubIdentity(accessToken: string): Promise<Identity> {
  const headers = { Authorization: `Bearer ${accessToken}`, 'User-Agent': config.APP_NAME, Accept: 'application/vnd.github+json' };

  const user = await fetch('https://api.github.com/user', { headers }).then((r) => r.json());
  const emails = await fetch('https://api.github.com/user/emails', { headers }).then((r) => r.json());
  const primary = emails.find((e) => e.primary && e.verified);

  if (!primary) throw new AppError('EMAIL_UNVERIFIED', 'Verify your email address on GitHub first', 400);

  return { providerUserId: String(user.id), email: primary.email, emailVerified: true, name: user.name ?? user.login };
}
```

Use the numeric `id`, never the `login` — usernames are renameable and get
recycled.

**OAuth App vs GitHub App:** for login, an OAuth App is simpler. Choose a
GitHub App if you also need repository access, because its permissions are
finer-grained and its tokens are scoped per installation.

## Any other provider

Okta, Auth0, Keycloak, Authentik, WorkOS, and Zitadel are all standard OIDC.
Arctic ships classes for them; each takes the tenant or base URL plus the
usual three arguments.

For something unsupported, use Arctic's generic client rather than writing
the flow yourself:

```ts
import { OAuth2Client, CodeChallengeMethod } from 'arctic';

const client = new OAuth2Client(clientId, clientSecret, redirectURI);
const url = client.createAuthorizationURLWithPKCE(authorizeEndpoint, state, CodeChallengeMethod.S256, codeVerifier, scopes);
const tokens = await client.validateAuthorizationCode(tokenEndpoint, code, codeVerifier);
```

If the provider publishes `/.well-known/openid-configuration`, prefer
`openid-client` and let discovery supply the endpoints
([choosing-a-library.md](choosing-a-library.md)).

## Comparison at a glance

| | Google | Microsoft Entra | GitHub |
| --- | --- | --- | --- |
| OIDC | Yes | Yes | No |
| ID token | Yes | Yes | No — call the API |
| `email_verified` | Yes | No | Via `/user/emails` |
| Stable id | `sub` | `sub` (per app) or `oid`+`tid` | numeric `id` |
| Secret expires | No | **Yes, ≤ 24 months** | No |
| Review needed | Only for sensitive scopes | No | No |

## Common mistakes

- Using `tenant: 'common'` and being surprised that personal accounts work.
- Trusting a Microsoft email as verified without deciding why it is safe to.
- Keying on GitHub `login` or Google `email` rather than the immutable id.
- Letting the Entra client secret expire.
- Leaving the Google consent screen in Testing at launch.
- Requesting broad scopes (`https://www.googleapis.com/auth/drive`) for a login button, which triggers verification and alarms users.

## Related

- [implementation.md](implementation.md)
- [account-linking.md](account-linking.md)
- [security.md](security.md)
