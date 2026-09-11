# Environment variables and secrets on Cloudflare

## Two kinds

| Kind | Where | Visible in dashboard/logs? | Use |
| --- | --- | --- | --- |
| **Vars** | `wrangler.jsonc` `vars` (per environment) | Yes, plain text | Non-secret config: `CORS_ORIGIN`, `LOG_LEVEL`, feature toggles |
| **Secrets** | `wrangler secret put NAME [--env x]` or dashboard; `.dev.vars` locally | Write-only | `JWT_SECRET`, API keys, database URLs (if not via Hyperdrive) |

Never put a secret in `vars`; it ends up in Git.

## Per environment

```jsonc
{
  "name": "app-worker",
  "vars": { "CORS_ORIGIN": "http://localhost:5173", "LOG_LEVEL": "debug" },
  "env": {
    "staging":    { "vars": { "CORS_ORIGIN": "https://staging.example.com", "LOG_LEVEL": "info" }, "r2_buckets": [{ "binding": "FILES", "bucket_name": "app-files-staging" }] },
    "production": { "vars": { "CORS_ORIGIN": "https://app.example.com", "LOG_LEVEL": "info" },     "r2_buckets": [{ "binding": "FILES", "bucket_name": "app-files-prod" }] }
  }
}
```

Secrets are set per environment too: `wrangler secret put JWT_SECRET --env production`.

## Local

`.dev.vars` (git-ignored) holds secrets for `wrangler dev`:

```dotenv
JWT_SECRET=local-dev-only-…
AUTOSEND_API_KEY=…
```

Commit `.dev.vars.example` with placeholders.

## Validation

There's no boot; validate lazily once per isolate:

```ts
// env.ts
const schema = z.object({ CORS_ORIGIN: z.string().url(), JWT_SECRET: z.string().min(32), LOG_LEVEL: z.enum(['debug','info','warn','error']).default('info') });
let cached: z.infer<typeof schema> | undefined;
export function getConfig(env: Env) {
  return (cached ??= schema.parse(env));      // throws → 500 with a clear message on the first request; visible in `wrangler tail`
}
```

## Pages (frontend)

Build-time variables (`VITE_API_URL`) are set in the Pages project settings
per environment (production / preview) and inlined at build. They are
public.

## Related

- [00-engineering-principles/configuration-management.md](../00-engineering-principles/configuration-management.md)
- [15-security/secrets.md](../15-security/secrets.md)
