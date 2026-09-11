# Monolith

## What is it?

One codebase, one deployable process (or one frontend + one API), one
database. All features run in the same process and call each other with
function calls.

## Why does it matter?

It is the cheapest architecture to build, run, debug, and change. Every
successful system that later split into services started here, and most
never needed to split.

## When should I use it?

- Any new product, regardless of ambition.
- Teams of one to roughly eight engineers.
- Requirements still changing weekly.
- Load that one well-configured server (or a couple behind a load balancer) can handle, which is far more than most products ever see.

## When should I NOT use it?

- A component has a genuinely different scaling profile (a video transcoder next to a CRUD API) *and* you have measured that it starves the rest.
- Regulatory isolation requires separate deployables.
- Multiple teams must release independently and stepping on each other is a measured cost.

Even then, extract *that one piece*; don't rewrite as microservices.

## Recommended approach

Structure the monolith so it can become a modular monolith without moving
files: feature folders from day one, layered inside each feature.

```text
apps/api/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── items/
│   └── shares/
├── middleware/
├── lib/            framework-agnostic helpers (errors, logger, jwt)
├── config.ts
├── app.ts          builds the Express/Hono app (no listen)
└── server.ts       listens, handles signals
```

```text
apps/web/src/
├── app/            router, providers, layouts
├── features/       one folder per feature, mirrors the API modules
├── components/     shared UI
├── lib/            api client, utils
└── main.tsx
```

Keep the frontend and API as separate apps in one repository
(`apps/web`, `apps/api`) sharing `packages/*`. This is still a monolith in the
sense that matters: one repo, one release, one database.

## Scaling a monolith before splitting it

1. Add indexes and fix queries ([03-databases/query-optimization.md](../03-databases/query-optimization.md)).
2. Cache reads that are expensive and tolerate staleness ([02-backend/caching.md](../02-backend/caching.md)).
3. Run more than one instance behind a load balancer (the process must be stateless: sessions in the database or a store, uploads to object storage).
4. Move heavy background work to a job queue *inside the same codebase* ([02-backend/background-jobs.md](../02-backend/background-jobs.md)).
5. Read replicas for read-heavy workloads.

Each step is cheaper than a service boundary and usually sufficient.

## Common mistakes

- "Big ball of mud": a monolith without module boundaries. The fix is [modular-monolith.md](modular-monolith.md), not microservices.
- Storing session or upload state in process memory, which blocks running a second instance.
- Coupling the frontend build to the API deploy so a CSS change redeploys the database layer. Separate apps, one repo.

## Checklist

- [ ] Feature folders, layered inside.
- [ ] Stateless process; anything shared lives in the database or object storage.
- [ ] `app.ts` (build) separated from `server.ts` (listen) so tests can import the app.
- [ ] Shared types and validation in workspace packages.

## Related

- [modular-monolith.md](modular-monolith.md)
- [choosing-an-architecture.md](choosing-an-architecture.md)
