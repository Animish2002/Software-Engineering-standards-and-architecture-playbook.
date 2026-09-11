# Connection pooling

## What is it?

Reusing a fixed set of open database connections instead of opening one per
query. Opening a Postgres connection costs tens of milliseconds and a
server-side process; the server has a hard `max_connections`.

## Sizing

```text
pool size per instance  ≈  (usable CPU cores of the DB × 2) + spindles ... in theory;
in practice: start at 10 per API instance, keep (instances × pool) < max_connections − reserve
```

- Hosted Postgres often has `max_connections` of 100-500 and reserves some for admin.
- More connections than the database can service in parallel just queue inside the database instead of in your pool; larger is not faster.
- Set `idleTimeoutMillis` so idle instances release connections, and `connectionTimeoutMillis` so a starved pool errors instead of hanging.

```ts
// packages/db/src/client.ts (node-postgres)
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.DB_POOL_MAX ?? 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: config.isProd ? { rejectUnauthorized: true } : undefined,
});
export const db = drizzle(pool, { schema });
```

One pool per process, created once, imported everywhere. Never a pool per
request or per module.

## Serverless and Workers

Each isolate/instance may open its own connections; thousands of short-lived
instances exhaust the server. Options:

| Environment | Approach |
| --- | --- |
| Cloudflare Workers | Hyperdrive (Cloudflare's pooler/proxy in front of Postgres) with `postgres`/`pg` driver, or an HTTP-based driver (Neon serverless), or D1 for SQLite-class needs |
| AWS Lambda / similar | RDS Proxy or PgBouncer in transaction mode |
| Long-lived Node (Railway, containers, K8s) | Plain pool as above |

External poolers in **transaction mode** break session-level features:
prepared statements by name, `SET` session variables, advisory locks across
statements. Use the driver's "no named prepared statements" option
(`prepare: false` in `postgres.js`) when behind such a pooler.

## Timeouts on the server side

```sql
-- per role or in the connection string options
alter role app set statement_timeout = '10s';
alter role app set idle_in_transaction_session_timeout = '30s';
alter role app set lock_timeout = '5s';
```

Runaway queries and abandoned transactions then release their connections.

## Health and shutdown

- Health endpoint runs `select 1` with a short timeout to report DB reachability and latency.
- On `SIGTERM`, stop accepting requests, wait for in-flight ones, then `pool.end()` ([06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md)).

## Common mistakes

- `max: 100` on three instances against a 100-connection database.
- Creating a client per request ("to be safe").
- Not releasing clients acquired manually (`pool.connect()` without `client.release()` in `finally`). Prefer `pool.query`/the ORM, which release for you.
- Ignoring pool wait time in latency investigations; log `pool.waitingCount` when it's non-zero.

## Checklist

- [ ] One pool per process; sized against `max_connections`.
- [ ] Idle and connection timeouts set.
- [ ] `statement_timeout`, `idle_in_transaction_session_timeout` set on the app role.
- [ ] Serverless runtimes go through a pooler/proxy.
- [ ] Pool closed on shutdown.

## Related

- [06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md)
- [09-cloudflare/bindings.md](../09-cloudflare/bindings.md) (Hyperdrive)
- [17-performance/database.md](../17-performance/database.md)
