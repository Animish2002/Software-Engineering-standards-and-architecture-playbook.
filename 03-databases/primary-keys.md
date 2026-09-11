# Primary keys: UUID vs auto-increment

## Options

| Strategy | Postgres | MySQL | Size | Ordered? | Guessable? |
| --- | --- | --- | --- | --- | --- |
| `bigint` identity | `bigint generated always as identity` | `bigint auto_increment` | 8 B | Yes | Yes (sequential) |
| UUID v4 (random) | `uuid default gen_random_uuid()` | `binary(16)` + app-generated | 16 B | No | No |
| UUID v7 (time-ordered) | `uuid` + app-generated (`crypto.randomUUID` is v4; use a v7 library) or PG 18 `uuidv7()` | `binary(16)` + app-generated | 16 B | Yes | Mostly not |
| ULID | `text`/`char(26)` or stored as UUID | same | 16-26 B | Yes | Mostly not |

## Recommendation

- **Default: UUID**, exposed in APIs and URLs. Not guessable, safe to generate on the client or in multiple writers, no enumeration of `/users/1`, `/users/2`.
- **Prefer v7 over v4** when the table is large and write-heavy: random v4 keys scatter inserts across the B-tree (page splits, poor cache locality); v7 keys are time-ordered and insert at the end like an integer. On Postgres 17 and earlier, generate v7 in the application (`uuidv7` package); Postgres 18 provides `uuidv7()`.
- **`bigint identity`** for internal, high-volume, append-only tables never exposed externally (audit logs, events, job queues) where 8 bytes and sequential inserts matter and enumeration is not a concern.
- **Never `int`** (4 bytes) for a PK you might exceed; `bigint` costs nothing meaningful.
- **Never a natural key** (email, SKU) as the PK on a referenced table. Natural keys change; surrogate keys don't. Put a `UNIQUE` on the natural key instead.

## MySQL specifics

- InnoDB clusters the table by primary key. Random UUID v4 PKs are expensive; use v7/ULID or `bigint auto_increment` with a separate `uuid` unique column for external exposure.
- Store UUIDs as `binary(16)` (`UUID_TO_BIN(uuid, 1)` swaps to time-ordered for v1; for v7 no swap needed), not `char(36)`.

## Composite primary keys

Use them on pure junction tables (`(user_id, role_id)`), where the pair *is*
the identity and nothing references the row. Everywhere else, surrogate `id`
+ `UNIQUE (a, b)`.

## Example

```sql
-- Postgres, recommended
create table files (
  id uuid primary key default gen_random_uuid(),   -- or app-generated v7
  ...
);

-- internal append-only
create table audit_logs (
  id bigint generated always as identity primary key,
  ...
);
```

```ts
// Drizzle, app-generated v7
import { uuidv7 } from 'uuidv7';
id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
```

## Common mistakes

- Exposing sequential ids in URLs, then discovering enumeration in the logs.
- Text UUIDs (`varchar(36)`) instead of the native `uuid`/`binary(16)` type: twice the size, slower comparisons.
- Mixing strategies across tables without a reason.

## Related

- [schema-design.md](schema-design.md)
- [indexing.md](indexing.md)
- [mysql/innodb.md](mysql/innodb.md)
