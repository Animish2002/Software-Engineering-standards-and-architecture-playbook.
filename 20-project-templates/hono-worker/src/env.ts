import { z } from 'zod';
import type { Logger } from './lib/logger';

export type Env = {
  DB: Hyperdrive;
  FILES: R2Bucket;
  CACHE: KVNamespace;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
  JWT_SECRET: string;          // secret
};

export type AuthUser = { id: string; email: string; name: string; permissionKeys: string[] };

export type Variables = {
  requestId: string;
  log: Logger;
  user?: AuthUser;
};

export type AppEnv = { Bindings: Env; Variables: Variables };

const configSchema = z.object({
  CORS_ORIGIN: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: z.string().min(32),
});

let cached: z.infer<typeof configSchema> | undefined;
/** Validate once per isolate; throws a clear error on the first request if misconfigured. */
export function getConfig(env: Env) {
  return (cached ??= configSchema.parse(env));
}
