# PostgreSQL data types

| Need | Use | Not | Why |
| --- | --- | --- | --- |
| Free text | `text` (+ `CHECK (length(x) <= n)` if bounded) | `varchar(255)` | Same storage and speed; the check is explicit and changeable |
| Email, usernames | `citext` | `text` + `lower()` everywhere | Case-insensitive comparison and uniqueness built in |
| Identifier | `uuid` | `text`/`varchar(36)` | 16 bytes, native comparison |
| Whole numbers | `integer` / `bigint` | `numeric` | Fast; `bigint` for anything that could exceed 2^31 (ids, bytes) |
| Money, exact decimals | `numeric(12,2)` or integer minor units (`price_cents bigint`) | `float`/`double` | Floats can't represent 0.1; integer cents avoid rounding entirely |
| Measurements, scores | `double precision` | `numeric` | Approximate is fine and faster |
| Timestamps | `timestamptz` | `timestamp` (without tz) | Stored in UTC, converted on read; `timestamp` silently assumes the session zone |
| Date only | `date` | `timestamptz` at midnight | Semantics; no timezone shifting surprises |
| Durations | `interval` or integer `*_ms`/`*_seconds` | `text` | Arithmetic works |
| Booleans | `boolean not null default false` | `int`, `char(1)` | Three-valued if nullable; make it not null |
| Closed sets | `text` + `CHECK (x in (...))`, or `create type ... as enum` | Free `text` | Enum is faster/stricter but adding values is DDL; `CHECK` is easier to evolve |
| Semi-structured | `jsonb` | `json`, `text` | Binary, indexable, deduplicated keys |
| Lists of scalars | `text[]`/`int[]` with GIN, or a child table | Comma-joined `text` | Arrays are fine for tags never joined; child table when you need FKs or per-item attributes |
| Binary | Object storage + `text` key; `bytea` only for tiny blobs | `bytea` for files | Files belong in R2/S3 |
| IP addresses | `inet` | `text` | Validation and range operators |
| Ranges | `tstzrange`, `int4range` | Two columns | Overlap operators and exclusion constraints |

## Timestamps and time zones

- Column type `timestamptz`; application sends and reads ISO 8601 with offset (`2026-09-11T10:00:00Z`).
- Set the database and connection timezone to UTC (`ALTER DATABASE app SET timezone = 'UTC'`).
- Format for humans in the frontend with the user's zone.

## Numeric vs integer cents

Prefer integer minor units (`amount_cents bigint`) for money in
application code: exact, fast, no scale mismatches across languages. Use
`numeric` when the scale varies (crypto, unit prices with 4+ decimals) or
for reporting sums.

## Enums

```sql
create type share_permission as enum ('view', 'edit');
alter type share_permission add value 'comment';   -- allowed, cannot run inside a transaction block in older PG
-- removing or renaming a value requires a type swap: create new type, alter column, drop old
```

Choose `CHECK IN` for sets that change; `enum` for sets that are truly fixed.

## Related

- [../schema-design.md](../schema-design.md)
- [json.md](json.md)
- [04-drizzle-orm/schema.md](../../04-drizzle-orm/schema.md)
