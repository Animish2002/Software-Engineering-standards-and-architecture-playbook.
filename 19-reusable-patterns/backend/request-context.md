# Request context middleware

```ts
// types/express.d.ts
import type { Logger } from 'pino';
export type AuthUser = { id: string; email: string; name: string; permissionKeys: string[] };
declare global {
  namespace Express {
    interface Request { id: string; log: Logger; user?: AuthUser; }
  }
}
```

```ts
// middleware/request-context.ts
import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger.js';

const SKIP_LOG = new Set(['/health', '/health/ready']);

export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.get('x-request-id');
  req.id = incoming && /^[\w-]{8,128}$/.test(incoming) ? incoming : randomUUID();
  req.log = logger.child({ reqId: req.id });
  res.setHeader('X-Request-Id', req.id);

  if (SKIP_LOG.has(req.path)) return next();

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    req.log.info({
      method: req.method,
      route: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path,
      status: res.statusCode,
      ms: Math.round(ms),
      userId: req.user?.id,
      ip: req.ip,
    }, 'request');
  });
  next();
};
```

Hono version: see [08-hono/middleware.md](../../08-hono/middleware.md).

Related: [02-backend/logging.md](../../02-backend/logging.md)
