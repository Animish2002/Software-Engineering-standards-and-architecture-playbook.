# Prepared statements

## What is it?

A query built once with placeholders and executed many times with different
values. The database parses and plans it once; Drizzle also skips
re-building the SQL string.

## When should I use it?

- A hot query executed thousands of times per minute with the same shape (auth lookup by id, permission resolution, "list children").
- Measured: building the query is a visible fraction of request time (rare, but real on Workers with tight CPU budgets).

## When should I NOT use it?

- Queries with dynamic shape (optional filters, variable column lists). Prepared statements need a fixed SQL string.
- Behind a transaction-mode pooler (PgBouncer/Hyperdrive in transaction mode), where named prepared statements may not survive across connections; use the driver's unnamed/`prepare: false` mode.
- As a first optimisation. Indexes and round-trip counts matter far more.

## Syntax

```ts
import { sql } from 'drizzle-orm';

export const findUserById = db
  .select({ id: users.id, email: users.email, name: users.name })
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('find_user_by_id');

// usage
const [user] = await findUserById.execute({ id });
```

- Declare at module level in the repository; execute with a values object.
- The name must be unique per connection; keep names stable and descriptive.
- Placeholders work in `where`, `limit`, `offset`, and values.

## Common mistakes

- Preparing inside a function (re-prepared on every call, defeating the purpose).
- Preparing queries whose filters are conditional (build a separate prepared statement per shape or don't prepare).

## Related

- [performance.md](performance.md)
- [03-databases/connection-pooling.md](../03-databases/connection-pooling.md)
