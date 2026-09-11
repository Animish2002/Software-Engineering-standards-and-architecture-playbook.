import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from 'hono/request-id';
import { bodyLimit } from 'hono/body-limit';
import type { AppEnv } from './env';
import { requestContext } from './middleware/request-context';
import { errorHandler, notFound } from './lib/errors';
import { ok } from './lib/response';
import { authRoutes } from './modules/auth';
import { itemsRoutes } from './modules/items';

export function createApp() {
  const app = new Hono<AppEnv>()
    .use('*', requestId())
    .use('*', requestContext)
    .use('*', secureHeaders())
    .use('*', bodyLimit({ maxSize: 1024 * 1024 }))
    .use('/api/*', cors({
      origin: (origin, c) => (origin === c.env.CORS_ORIGIN ? origin : ''),
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
      exposeHeaders: ['X-Request-Id'],
      maxAge: 600,
    }))
    .get('/health', (c) => c.json(ok({ status: 'ok' })))
    .route('/api/auth', authRoutes)
    .route('/api', itemsRoutes);        // spans /items, /folders, /files: mounted last

  app.notFound(notFound);
  app.onError(errorHandler);
  return app;
}
