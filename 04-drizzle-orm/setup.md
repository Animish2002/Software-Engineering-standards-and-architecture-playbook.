# Drizzle setup

## Package layout (monorepo)

```text
packages/db/
├── package.json            name: "@app/db"
├── drizzle.config.ts
├── drizzle/                generated migrations + meta/ (committed)
├── src/
│   ├── schema/
│   │   ├── index.ts        re-exports every table + relations
│   │   ├── users.ts
│   │   ├── rbac.ts
│   │   ├── items.ts
│   │   └── shares.ts
│   ├── client.ts           pool + drizzle instance
│   ├── seed/
│   │   ├── rbac.ts         reference data, reconciling (production-safe)
│   │   └── demo.ts         demo accounts (never in production)
│   └── scripts/
│       ├── migrate.ts
│       └── check.ts        read-only status report
└── tsconfig.json
```

The API imports `@app/db` for the client and schema; workers and scripts
import the same package. Nothing else opens a connection.

## Install

```bash
npm i drizzle-orm pg            # Postgres via node-postgres
npm i -D drizzle-kit @types/pg
# MySQL:  npm i drizzle-orm mysql2
# Workers + Postgres: npm i drizzle-orm postgres   (postgres.js, via Hyperdrive)
```

## `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',                 // 'mysql' | 'sqlite'
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,                          // confirm destructive changes
  verbose: true,
});
```

## Client

```ts
// src/client.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
export const db = drizzle(pool, { schema, logger: process.env.DB_LOG === '1' });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
```

Passing `schema` enables the relational query API (`db.query.users...`).

## Scripts (root `package.json`)

```json
{
  "db:generate": "drizzle-kit generate --config packages/db/drizzle.config.ts",
  "db:migrate":  "tsx packages/db/src/scripts/migrate.ts",
  "db:check":    "tsx packages/db/src/scripts/check.ts",
  "db:studio":   "drizzle-kit studio --config packages/db/drizzle.config.ts",
  "db:seed:rbac": "tsx packages/db/src/seed/rbac.ts",
  "db:seed":     "tsx packages/db/src/seed/demo.ts"
}
```

Always pass `-- --name=descriptive_name` to `db:generate`.

```ts
// src/scripts/migrate.ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../client';
await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });
await pool.end();
```

## Environment loading

Scripts run with `node --env-file=.env.local` (or `tsx --env-file`). The
API loads config through its validated `config.ts`; the db package reads
only `DATABASE_URL`.

## Related

- [schema.md](schema.md)
- [migrations.md](migrations.md)
- [20-project-templates/drizzle-postgres/](../20-project-templates/drizzle-postgres/README.md)
