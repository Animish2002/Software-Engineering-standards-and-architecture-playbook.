# Backend configuration

The principles and the config-module pattern are in
[00-engineering-principles/configuration-management.md](../00-engineering-principles/configuration-management.md).
This page lists what a backend typically needs and how each environment
supplies it.

## Standard variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` / `test` / `production` | Controls logging format, rate limiting in tests, cookie `secure`. |
| `PORT` | Listen port | Platforms inject it; default locally. |
| `DATABASE_URL` | Postgres/MySQL connection string | Use the pooled/proxy URL in production if the platform provides one. |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing | ≥ 32 random bytes each; different values. |
| `CORS_ORIGIN` | Allowed browser origin | Exact origin, not `*`, when credentials are used. Also used to build links in emails. |
| `LOG_LEVEL` | pino level | `info` in production. |
| Storage: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Object storage | Separate bucket (and ideally account) per environment. |
| Email: `<PROVIDER>_API_KEY`, `<PROVIDER>_FROM_EMAIL`, `<PROVIDER>_FROM_NAME` | Transactional email | Sender domain must be verified with the provider. |
| Bot protection: `TURNSTILE_SECRET_KEY` | Login/signup challenge | Use the provider's always-pass test key under `NODE_ENV=test`. |

## Loading

- Local: `node --env-file=.env.local` (Node 20.6+) or `dotenv` in the entrypoint only.
- Test: `.env.test` committed **without secrets** (local DB URL, test keys) or CI variables.
- Production: platform variables/secrets. Never a `.env` file in the image.

## `.env.example`

Commit it. Every variable, a placeholder value, a one-line comment. It is
the onboarding document.

```dotenv
# Server
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug

# Database (local Docker Postgres; see docs/LOCAL-SETUP.md)
DATABASE_URL=postgres://app:app@localhost:5433/app

# Auth (generate: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
JWT_SECRET=
JWT_REFRESH_SECRET=

# Browser origin allowed to call the API (also used to build links in emails)
CORS_ORIGIN=http://localhost:5173
```

## Test-mode switches

Some behaviours must differ under test and only there. Gate them on
`config.NODE_ENV === 'test'`, in one place each, and name them:

- Rate limiting off (tests deliberately storm 401/403).
- Bot-protection secret set to the provider's test key.
- Email transport replaced by a no-op or a capture buffer.

Never gate *security* behaviour (auth, permission checks) on environment.

## Checklist

- [ ] `config.ts` validates everything above at boot.
- [ ] `.env.example` complete and committed.
- [ ] Separate DB/bucket/secrets per environment.
- [ ] `CORS_ORIGIN` exact; cookies `secure` in production.
- [ ] Test-only switches are explicit and never weaken auth.

## Related

- [18-devops/environments.md](../18-devops/environments.md)
- [15-security/secrets.md](../15-security/secrets.md)
