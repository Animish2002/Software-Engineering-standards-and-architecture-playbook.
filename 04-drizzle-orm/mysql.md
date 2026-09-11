# Drizzle with MySQL

Same workflow, different core module and a few behaviours.

```ts
import { mysqlTable, varchar, bigint, boolean, datetime, index, uniqueIndex, primaryKey } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, timezone: 'Z' });
export const db = drizzle(pool, { schema, mode: 'default' });   // mode: 'planetscale' for PlanetScale (no FKs)
```

```ts
export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  publicId: binary('public_id', { length: 16 }).notNull(),         // UUID for the API
  email: varchar('email', { length: 254 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  createdAt: datetime('created_at', { fsp: 6 }).notNull().default(sql`current_timestamp(6)`),
  updatedAt: datetime('updated_at', { fsp: 6 }).notNull().default(sql`current_timestamp(6)`).$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('uq_users_email').on(t.email),
  uniqueIndex('uq_users_public_id').on(t.publicId),
]);
```

## Differences that affect code

| Postgres (Drizzle) | MySQL (Drizzle) |
| --- | --- |
| `.returning()` | Not available; `insert()` returns `[{ insertId }]`. Generate ids in the app or re-select. |
| `onConflictDoUpdate({ target })` | `onDuplicateKeyUpdate({ set })` (any unique key) |
| `index().where()` partial | Not available; use a generated column that is NULL for excluded rows |
| `pgEnum` | `mysqlEnum('col', [...])` inline |
| `timestamp({ withTimezone })` | `datetime({ fsp: 6 })`, store UTC |
| `uuid()` | `binary(16)` + app conversion, or `varchar(36)` (simpler, larger) |
| `boolean` | `boolean` (maps to `tinyint(1)`) |
| `serial` | `serial` / `int().autoincrement()` |
| `text` | `text` (not indexable without prefix); prefer `varchar(n)` |
| `for('update')` | Same; `skipLocked` available |
| Transactions with DDL | DDL commits implicitly; keep migrations small |

## Reading generated migrations

MySQL DDL from the generator is not transactional. Read each file and make
sure a failure mid-file leaves a state you can recover from (split into
several migrations when in doubt).

## Related

- [03-databases/mysql/README.md](../03-databases/mysql/README.md)
- [03-databases/mysql/differences-from-postgres.md](../03-databases/mysql/differences-from-postgres.md)
