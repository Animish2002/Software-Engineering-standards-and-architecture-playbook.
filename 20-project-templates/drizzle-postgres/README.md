# Template: Drizzle + PostgreSQL package

```text
packages/db/
├── package.json
├── drizzle.config.ts
├── drizzle/                     generated migrations + meta (committed)
└── src/
    ├── index.ts                 exports db, pool, types
    ├── client.ts
    ├── schema/
    │   ├── index.ts
    │   ├── _shared.ts           id(), timestamps, softDelete
    │   ├── users.ts
    │   ├── rbac.ts
    │   └── items.ts
    ├── seed/
    │   ├── rbac.ts              reconciling reference data (production-safe)
    │   └── demo.ts              demo accounts (refuses in production)
    └── scripts/
        ├── migrate.ts
        └── check.ts             read-only status report
```

Files in this folder: [package.json](package.json), [drizzle.config.ts](drizzle.config.ts),
[src/client.ts](src/client.ts), [src/schema/_shared.ts](src/schema/_shared.ts),
[src/schema/users.ts](src/schema/users.ts), [src/schema/rbac.ts](src/schema/rbac.ts),
[src/seed/rbac.ts](src/seed/rbac.ts), [src/scripts/check.ts](src/scripts/check.ts).

## Root scripts

```json
{
  "db:generate": "drizzle-kit generate --config packages/db/drizzle.config.ts",
  "db:migrate":  "tsx --env-file=.env.local packages/db/src/scripts/migrate.ts",
  "db:check":    "tsx --env-file=.env.local packages/db/src/scripts/check.ts",
  "db:seed:rbac": "tsx --env-file=.env.local packages/db/src/seed/rbac.ts",
  "db:seed":     "tsx --env-file=.env.local packages/db/src/seed/demo.ts",
  "db:studio":   "drizzle-kit studio --config packages/db/drizzle.config.ts"
}
```

Standards: [03-databases/](../../03-databases/README.md), [04-drizzle-orm/](../../04-drizzle-orm/README.md).
