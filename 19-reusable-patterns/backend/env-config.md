# Environment config module

```ts
// src/config.ts
import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().url(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  CORS_ORIGIN: z.string().url(),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),

  EMAIL_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string().min(1),

  TURNSTILE_SECRET_KEY: z.string().min(1),
  RATE_LIMIT_ENABLED: bool.default('true'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:\n', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const env = parsed.data;
export const config = Object.freeze({
  ...env,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  rateLimitEnabled: env.RATE_LIMIT_ENABLED && env.NODE_ENV !== 'test',
});
export type Config = typeof config;

// non-secret summary for the boot log
export const configSummary = () => ({
  NODE_ENV: env.NODE_ENV, PORT: env.PORT, LOG_LEVEL: env.LOG_LEVEL, CORS_ORIGIN: env.CORS_ORIGIN,
  R2_BUCKET_NAME: env.R2_BUCKET_NAME, EMAIL_FROM: env.EMAIL_FROM, DB_POOL_MAX: env.DB_POOL_MAX,
});
```

Workers variant: export `parseEnv(env: Env)` with the same schema and
memoise per isolate ([09-cloudflare/environment-variables.md](../../09-cloudflare/environment-variables.md)).

Related: [00-engineering-principles/configuration-management.md](../../00-engineering-principles/configuration-management.md)
