# Choosing an OAuth library

## The decision

```text
Do you need to call a provider's API on the user's behalf, or just log people in?
│
├─ Just log in, and you already have sessions (this stack does)
│  └─ Arctic + your existing session code            ← default
│
├─ Greenfield, and you want sessions/MFA/linking solved for you
│  └─ Better Auth  (or Auth.js if the app is Next.js and you want the ecosystem)
│
├─ A corporate IdP (Okta, Entra, Keycloak, Ping) with full OIDC conformance,
│  discovery documents, and back-channel logout
│  └─ openid-client
│
└─ Selling to enterprises that each bring their own IdP/SAML, and you do not
   want to operate that
   └─ WorkOS / Auth0 / Clerk  (paid, and worth it at that point)
```

## Comparison

| Library | What it is | Choose it when | Cost |
| --- | --- | --- | --- |
| **Arctic** (3.x) — default | ~50-line-per-provider OAuth client. 50+ providers, typed, runtime-agnostic (Node, Bun, Workers). Builds URLs and exchanges codes. Nothing else. | You have a session system and want OAuth to be the part it is: two routes | You write the routes, cookies, and user lookup. About 80 lines. |
| **openid-client** (6.x) | The OIDC-certified relying party for JS. Discovery, JWKS, full token validation, DPoP, back-channel logout. | Real OIDC providers, enterprise conformance requirements, or anything where "certified" is in the procurement questionnaire | More API surface; ESM-only |
| **Better Auth** (1.x) | A full auth framework: sessions, social providers, MFA, organisations, account linking, plugins. Owns its database tables. | Greenfield, and you would otherwise hand-roll everything on this list | It owns your auth schema and session model. Migrating away later is real work. |
| **Auth.js / NextAuth** | Session + provider framework, strongest inside Next.js | The app is Next.js and you want the adapter ecosystem | Opinionated; awkward outside Next.js |
| **Passport** (+ `passport-google-oauth20`) | The old standard. Strategy-per-provider, callback-style, Express-coupled. | Maintaining an existing Passport app | Many strategies are unmaintained and still default to non-PKCE flows. Do not start here. |
| **Hosted** (Clerk, WorkOS, Auth0) | Auth as a service | Enterprise SSO/SCIM matters more than control, or you have no one to own auth | Per-user pricing; your identity data lives elsewhere |
| **Hand-rolled `fetch`** | You write the URL building and token exchange yourself | Never, unless the provider is obscure and unsupported — then use Arctic's generic `OAuth2Client` | Every mistake in [security.md](security.md) is yours to make |

## Why Arctic is the default here

This repository already specifies sessions, refresh-token rotation, and
revocation ([02-backend/authentication.md](../02-backend/authentication.md)).
A framework that brings its own session model would replace a working,
understood system with a second one. Arctic slots in at exactly the point
where OAuth differs from password login — verifying the credential — and
leaves the rest alone.

```ts
// The entire library surface you need
import { Google, generateState, generateCodeVerifier, decodeIdToken, OAuth2RequestError } from 'arctic';

const google = new Google(clientId, clientSecret, redirectURI);
const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
const tokens = await google.validateAuthorizationCode(code, codeVerifier);
const claims = decodeIdToken(tokens.idToken());
```

## When to switch to Better Auth

Switch if you find yourself building three or more of: account linking UI,
MFA enrolment, organisation/team membership, impersonation, session
management screens, passkeys. At that point you are writing an auth
framework, and a maintained one is better than yours.

Make the call early. Migrating sessions and password hashes into Better
Auth's schema after launch is a migration with a forced logout in it.

## When to switch to openid-client

- The provider publishes a discovery document you should be consuming rather than hardcoding endpoints.
- You need back-channel or front-channel logout, DPoP, or JAR/PAR.
- A customer's security review asks whether your OIDC client is certified.

```ts
// openid-client v6: discovery-driven, no hardcoded endpoints
import * as client from 'openid-client';

const config = await client.discovery(new URL('https://accounts.google.com'), clientId, clientSecret);
const tokens = await client.authorizationCodeGrant(config, currentUrl, {
  pkceCodeVerifier: codeVerifier,
  expectedState: state,
  expectedNonce: nonce,
});
```

Note that it validates `state` and `nonce` for you, which is a genuine
advantage over doing it by hand.

## Don't

- Start a new project on Passport.
- Use a "social login" npm package with one maintainer and no PKCE support.
- Build the flow with raw `fetch` to save a dependency. This is the wrong place to save 8 KB.
- Adopt Better Auth *and* keep your own session table. Pick one owner of the session.

## Related

- [implementation.md](implementation.md)
- [providers.md](providers.md)
- [23-decision-guides/README.md](../23-decision-guides/README.md)
