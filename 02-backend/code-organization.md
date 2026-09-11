# Backend code organization

Where each kind of code goes. The structure is in
[architecture.md](architecture.md); this is the lookup table.

## Placement table

| Code | Location | Notes |
| --- | --- | --- |
| Route definitions | `modules/<f>/<f>.routes.ts` | Path → middleware → controller. No logic. |
| Request parsing, validation, response shaping | `modules/<f>/<f>.controller.ts` | Only place that touches `req`/`res`/`c`. |
| Business rules, orchestration, cross-module calls | `modules/<f>/<f>.service.ts` | Plain functions with plain inputs. |
| Database queries | `modules/<f>/<f>.repository.ts` | Drizzle only. No rules. Not exported from `index.ts`. |
| Request/response Zod schemas | `packages/validation` (shared with web) or `modules/<f>/<f>.schema.ts` (API-only) | Shared when a form uses the same shape. |
| Module-local types | `modules/<f>/<f>.types.ts` | Cross-boundary types go in `packages/shared-types`. |
| Module public surface | `modules/<f>/index.ts` | Router + service functions other modules may use. |
| Tests for rules | `modules/<f>/<f>.service.test.ts` | Beside the code. Integration/API tests under `tests/`. |
| Auth, permission, rate limit, logging, error middleware | `middleware/` | Applied in `app.ts` or per route. |
| Errors, logger, JWT, hashing, ids, envelope helpers | `lib/` | Framework-agnostic; copyable between projects. |
| Database client and pool | `db/client.ts` | One instance; imported by repositories only. |
| Schema, migrations, seeds | `packages/db` | Shared by API, workers, scripts. |
| Config | `config.ts` | Zod-validated; only reader of `process.env`. |
| App assembly | `app.ts` | Middleware order, router mounting. |
| Process lifecycle | `server.ts` | Listen, signals, shutdown. |
| Scripts (seed, promote admin) | `scripts/` or `packages/db/src/scripts` | Run with `tsx`; not part of the server bundle. |
| Integration/API tests | `tests/api/` | Hit the running server with real HTTP. |

## File naming

`<feature>.<role>.ts` — `users.service.ts`, `users.routes.ts`. The role
suffix makes the layer visible in every import and search result. See
[00-engineering-principles/naming-conventions.md](../00-engineering-principles/naming-conventions.md).

## Module `index.ts`

```ts
// modules/items/index.ts
export { itemsRouter } from './items.routes';
export { getItemKind, resolveAccess } from './items.service';   // what other modules may call
export type { DriveItem } from './items.types';
// NOT exported: items.repository
```

## `app.ts` skeleton

```ts
export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(requestContext);                 // id + logger
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/health', healthRouter);        // public, before auth
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/shares', sharesRouter);        // contains public sub-routes; prefix keeps them reachable
  app.use(itemsRouter);                    // spans /items, /folders, /files → registered last
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
```

Order matters: public routers before any router whose internal
`.use(authenticate)` would otherwise intercept them.

## What NOT to have

- `helpers/`, `utils/`, `common/` at the top level holding business code.
- `models/` as a separate layer in a Drizzle app: the schema is the model.
- `dtos/` folders mirroring the schemas one-to-one. Use `z.infer`.
- `interfaces/` folder of single-implementation interfaces.
- `constants/` holding values that are really config (env) or really database data (roles, permissions).

## Related

- [layers.md](layers.md)
- [01-project-architecture/feature-based-architecture.md](../01-project-architecture/feature-based-architecture.md)
- [20-project-templates/express-node/](../20-project-templates/express-node/README.md)
