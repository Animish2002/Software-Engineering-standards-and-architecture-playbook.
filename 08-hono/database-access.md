# Database access from Hono

## On Cloudflare Workers

Workers are short-lived isolates; there is no long-lived pool. Options:

| Option | When | Drizzle driver |
| --- | --- | --- |
| **Hyperdrive + Postgres** (recommended for relational) | You have/want Postgres (Railway, Neon, RDS); Hyperdrive pools and caches connections at the edge | `drizzle-orm/postgres-js` with `postgres(env.DB.connectionString, { max: 1, prepare: false })` or `drizzle-orm/node-postgres` with `pg` (needs `nodejs_compat`) |
| Neon serverless driver (HTTP/WebSocket) | Neon-hosted Postgres; no Hyperdrive | `drizzle-orm/neon-http` |
| **D1** | Small/medium app, edge-local SQLite is enough | `drizzle-orm/d1` |
| PlanetScale (HTTP) | MySQL-compatible serverless | `drizzle-orm/planetscale-serverless` |

```ts
// db/client.ts (Workers + Hyperdrive + postgres.js)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@app/db/schema';

export function getDb(env: Env) {
  const sql = postgres(env.DB.connectionString, { max: 1, prepare: false, fetch_types: false });
  return drizzle(sql, { schema });
}
```

- `max: 1` per request; Hyperdrive does the real pooling.
- `prepare: false` because the pooler is transaction-mode.
- Create per request (cheap) or memoise per `env` within the isolate; close nothing (the isolate ends).
- Set a `statement_timeout` on the DB role; Workers have a CPU-time limit, not a wall-clock one for I/O, but the client shouldn't wait forever.

```ts
// D1
import { drizzle } from 'drizzle-orm/d1';
export const getDb = (env: Env) => drizzle(env.D1, { schema });
```

D1 migrations use `wrangler d1 migrations apply` with the SQL files
drizzle-kit generates (`dialect: 'sqlite'`, `driver: 'd1-http'`).

## On Node (`@hono/node-server`)

Identical to Express: one pooled `pg` client at module level ([03-databases/connection-pooling.md](../03-databases/connection-pooling.md)).

## Services take the db

```ts
export async function listChildren(env: Env, actorId: string, folderId: string | null) {
  const db = getDb(env);
  // ...
}
```

Or a middleware sets `c.set('db', getDb(c.env))` once per request and
services take `db` as their first argument. Either way, the repository
functions are the same modules used on Node (they accept a `DbOrTx`).

## Transactions on Workers

`db.transaction` works over Hyperdrive/postgres.js. Keep them short;
never `await fetch()` inside. D1 supports `batch()` (atomic) rather than
interactive transactions.

## Related

- [04-drizzle-orm/setup.md](../04-drizzle-orm/setup.md)
- [09-cloudflare/bindings.md](../09-cloudflare/bindings.md)
