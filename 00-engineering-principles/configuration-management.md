# Configuration management

## What is it?

Everything that differs between environments (URLs, credentials, feature
toggles, limits) supplied from outside the code, read once, validated at
startup, and exposed as a typed object.

## Why does it matter?

`process.env.FOO` scattered through the code means a typo is discovered at
runtime in production, defaults hide misconfiguration, and nobody knows what
the app needs to run.

## Recommended approach

1. **One `config` module** reads the environment, validates with Zod, and exports a frozen object. Nothing else touches `process.env` (or `env` bindings on Workers).
2. **Fail fast.** A missing or malformed value crashes at boot with a clear message, not at the first request that needs it.
3. **No secrets in code or in the repository.** `.env.example` lists every variable with a placeholder; `.env*` is git-ignored.
4. **Frontend variables are public.** `VITE_*` is inlined into the bundle. Only URLs and public keys belong there.

```ts
// src/config.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  R2_BUCKET_NAME: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const config = Object.freeze({
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
});
```

```ts
// anywhere else
import { config } from '@/config';
app.listen(config.PORT);
```

On Cloudflare Workers, validate `env` once per request (or lazily memoise) since
there is no process boot; see [09-cloudflare/environment-variables.md](../09-cloudflare/environment-variables.md).

## Environments

| Environment | Purpose | Source of config |
| --- | --- | --- |
| `development` | Local machine | `.env.local` (git-ignored) |
| `test` | Automated tests | `.env.test` or CI variables; disables rate limits, uses test DB |
| `production` | Live | Platform secrets (Railway variables, GitHub environment secrets, `wrangler secret`) |

Never share a database or bucket between environments.

## Bad example

```ts
// Avoid
const port = process.env.PORT || 3000;              // silent default hides a misconfig
const secret = process.env.JWT_SECRET || 'dev';      // production could run with 'dev'
if (process.env.NODE_ENV == 'prod') { /* ... */ }    // typo: it's 'production'
```

## Common mistakes

- Defaults for secrets.
- Reading env in modules at import time before dotenv has loaded (load env first in the entrypoint, or use `node --env-file=.env.local`).
- Committing `.env`. Rotate any secret that was ever committed; history is public.
- Using config for business rules that don't vary by environment. Those are constants in code.
- Feature flags for everything. Add a flag when a rollout needs one, remove it when the rollout is done.

## Production considerations

- Secrets come from the platform's secret store, injected as env vars.
- Log a redacted config summary at boot (names and non-secret values).
- Changing config should not require a code change, but it does require a redeploy/restart; design for that.

## Checklist

- [ ] One config module, Zod-validated, frozen.
- [ ] No `process.env` outside it.
- [ ] `.env.example` is complete and committed; `.env*` is ignored.
- [ ] No default value for any secret.
- [ ] `VITE_*` contains no secrets.
- [ ] Separate databases/buckets per environment.

## Related

- [15-security/secrets.md](../15-security/secrets.md)
- [18-devops/environments.md](../18-devops/environments.md)
- [19-reusable-patterns/backend/env-config.md](../19-reusable-patterns/backend/env-config.md)
