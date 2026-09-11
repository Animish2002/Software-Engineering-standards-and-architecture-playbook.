# Express project structure

```text
apps/api/src/
├── modules/
│   ├── auth/       auth.routes.ts, auth.controller.ts, auth.service.ts, index.ts
│   ├── users/
│   ├── items/
│   └── shares/
├── middleware/     authenticate.ts, require-permission.ts, request-context.ts, rate-limit.ts, not-found.ts, error-handler.ts
├── lib/            errors.ts, logger.ts, response.ts, jwt.ts, password.ts
├── db/             client re-export from @app/db
├── routes.ts       mounts every module router with its prefix
├── config.ts
├── app.ts
└── server.ts
```

## `app.ts`

```ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { requestContext } from './middleware/request-context.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { routes } from './routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);                                  // one hop: the platform's load balancer

  app.use(requestContext);                                    // req.id, req.log, X-Request-Id
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true, exposedHeaders: ['X-Request-Id'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
```

## `routes.ts`

```ts
import { Router } from 'express';
import { healthRouter } from './modules/health/index.js';
import { authRouter } from './modules/auth/index.js';
import { usersRouter } from './modules/users/index.js';
import { sharesRouter } from './modules/shares/index.js';
import { itemsRouter } from './modules/items/index.js';

export const routes = Router();
routes.use('/health', healthRouter);        // public
routes.use('/auth', authRouter);            // mixed public/private, self-contained
routes.use('/users', usersRouter);
routes.use('/shares', sharesRouter);        // contains public sub-routes
routes.use(itemsRouter);                    // spans /items, /folders, /files: LAST, so its .use(authenticate) can't shadow the others
```

Every router with a single prefix is mounted with it. A router mounted at
`/` receives **every** request, and any `router.use(authenticate)` inside
it intercepts requests meant for routers registered later. See
[production-structure.md](production-structure.md).

## A module

```ts
// modules/users/users.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as c from './users.controller.js';

export const usersRouter = Router();
usersRouter.use(authenticate);                                          // whole module requires auth
usersRouter.get('/directory', c.directory);                             // any authenticated user (registered before the gate)
usersRouter.use(requirePermission('user:manage'));                      // everything below is admin-only
usersRouter.get('/', c.list);
usersRouter.post('/', c.create);
usersRouter.patch('/:id', c.update);
usersRouter.delete('/:id', c.trash);
usersRouter.post('/:id/restore', c.restore);
```

```ts
// modules/users/index.ts
export { usersRouter } from './users.routes.js';
export { findPublicById as getUser } from './users.service.js';
```

## `server.ts`

See [06-nodejs/project-structure.md](../06-nodejs/project-structure.md) and
[06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md).

## Related

- [02-backend/code-organization.md](../02-backend/code-organization.md)
- [20-project-templates/express-node/](../20-project-templates/express-node/README.md)
