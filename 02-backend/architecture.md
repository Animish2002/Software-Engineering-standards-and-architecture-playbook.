# Backend architecture

## What is it?

How a single backend application is structured internally. The whole-system
question (one service or many) is answered in
[01-project-architecture/](../01-project-architecture/README.md); this page
assumes one backend app.

## Comparison

| Structure | Shape | Use when | Stop using when |
| --- | --- | --- | --- |
| **Flat** | `routes/`, `services/`, `db/` at top level | 1-3 resources, one contributor | A feature spans 4+ files across folders |
| **Feature modules, layered inside** (recommended default) | `modules/<feature>/{routes,controller,service,repository,schema}` | Any real product | Never, for a single deployable |
| **Modular monolith** | Feature modules + enforced `index.ts` boundaries + lint | 4+ modules, 3+ contributors | Never, for a single deployable |
| **Clean / hexagonal (full)** | Use cases, entities, ports, adapters, DI | Multiple real adapters per port, long-lived domain-heavy product | It becomes ceremony (one implementation per interface) |
| **Microservices** | Separate deployables, own data | Proven scaling/team need | See [01-project-architecture/microservices.md](../01-project-architecture/microservices.md) |

## Recommended structure

```text
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts        (or import from packages/validation)
│   │   └── auth.service.test.ts
│   ├── users/
│   ├── items/
│   └── shares/
├── middleware/
│   ├── authenticate.ts
│   ├── require-permission.ts
│   ├── request-context.ts        request id + child logger
│   ├── rate-limit.ts
│   └── error-handler.ts
├── lib/
│   ├── errors.ts
│   ├── logger.ts
│   ├── jwt.ts
│   ├── response.ts               ok() / fail()
│   ├── password.ts
│   └── async-handler.ts          (Express 4 only; Express 5 handles async)
├── db/
│   ├── client.ts                 drizzle instance, pool
│   └── index.ts                  re-exports schema from packages/db
├── config.ts
├── app.ts                        createApp(): wires middleware + routers
└── server.ts                     listen, signals, graceful shutdown
```

### Why this works

- **Feature folders** keep a change local and make ownership obvious.
- **Layers inside a feature** keep transport, rules, and persistence separately testable.
- **`middleware/` and `lib/` hold no business rules**, so they can be copied to the next project unchanged (see [19-reusable-patterns/](../19-reusable-patterns/README.md)).
- **`app.ts` vs `server.ts`** lets tests import the app without opening a port.
- **`packages/*`** hold what the frontend shares: types, validation, and (optionally) the database schema.

### When to change it

| Signal | Change |
| --- | --- |
| Two modules import each other's repositories | Add `index.ts` public surfaces and a lint rule ([modular-monolith](../01-project-architecture/modular-monolith.md)) |
| A module needs a second storage/email/payment provider | Introduce a port interface for that one dependency ([clean-and-hexagonal](../01-project-architecture/clean-and-hexagonal.md)) |
| A module's traffic or runtime differs by an order of magnitude | Extract that module, keep the rest |
| A "module" has no routes (pure shared logic) | It's `lib/` or a package, not a module |

## Request lifecycle inside a module

```text
users.routes.ts        router.post('/', requirePermission('user:manage'), controller.create)
users.controller.ts    parse body with createUserSchema → usersService.create(input, req.user) → 201 ok(user)
users.service.ts       rules (uniqueness, role tier, quota) → usersRepo.insert → side effects (email, audit)
users.repository.ts    drizzle insert/select only
```

## Common mistakes

- A `utils/` folder that grows business helpers. Business helpers belong to the module that owns the concept.
- Registering routers at `/` with a blanket `.use(authenticate)`, which shadows later public routers. Mount every router with its prefix and register unprefixed ones last.
- Controllers importing the database client "for a quick query".
- Putting migrations, seeds, and the schema in the API app when a second consumer (a worker, a script) will need them. Keep them in `packages/db`.

## Checklist

- [ ] Feature modules with layers inside.
- [ ] `middleware/` and `lib/` contain no business rules.
- [ ] `app.ts` builds; `server.ts` listens.
- [ ] Shared types/validation in packages.
- [ ] Routers mounted with explicit prefixes.

## Related

- [code-organization.md](code-organization.md)
- [layers.md](layers.md)
- [07-express/project-structure.md](../07-express/project-structure.md)
- [08-hono/project-structure.md](../08-hono/project-structure.md)
