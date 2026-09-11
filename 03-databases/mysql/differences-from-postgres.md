# MySQL vs PostgreSQL: what changes in practice

| Topic | PostgreSQL | MySQL 8 (InnoDB) | Design impact |
| --- | --- | --- | --- |
| Default isolation | Read Committed | Repeatable Read (with gap locks) | Consider `READ COMMITTED` on MySQL for insert-heavy OLTP |
| `RETURNING` | Yes | No | Generate ids in the app or re-select after insert |
| Partial indexes | Yes | No | Use generated columns that are `NULL` for excluded rows and index those |
| Expression indexes | Yes | Functional indexes (8.0.13+) | Similar; syntax `index ((lower(email)))` |
| Case-insensitive text | `citext` or `lower()` index | Collation-driven (`_ci`) | Choose collation per column deliberately |
| Transactional DDL | Yes (migration rolls back on failure) | No (each DDL commits) | A failed MySQL migration can leave a half-applied state; write small migrations |
| `CHECK` constraints | Always enforced | Enforced since 8.0.16 | Verify version; older MySQL silently ignores them |
| Enum | Custom type, DDL to change | Column-level `enum`, `ALTER TABLE` to change | Same tradeoff; `varchar` + `CHECK` is portable |
| UUID | Native `uuid` type | `binary(16)` + `UUID_TO_BIN` | App-generated v7 recommended on both |
| Arrays | Native | No; use JSON or child table | Child tables are the portable choice |
| JSON | `jsonb` with GIN | `json` with generated-column indexes | Extract keys to generated columns for indexing on MySQL |
| Recursive CTE | Yes | Yes (8.0+) | Same approach for trees |
| Window functions | Yes | Yes (8.0+) | Same |
| Row-value comparison `(a,b) < (x,y)` | Yes, index-usable | Yes (8.0+ uses the index) | Keyset pagination works on both |
| `ON CONFLICT` | `ON CONFLICT (col) DO UPDATE` | `ON DUPLICATE KEY UPDATE` (any unique key) | Drizzle abstracts both: `onConflictDoUpdate` / `onDuplicateKeyUpdate` |
| Materialized views | Yes | No | Use a table refreshed by a job |
| Boolean | `boolean` | `tinyint(1)` | Drizzle maps both |
| Timestamps | `timestamptz` | `datetime(6)` in UTC | Set server/session zone to UTC on MySQL |
| Identifier quoting | `"double"` | `` `backtick` `` | Lowercase names avoid quoting on both |
| `LIMIT` in `DELETE`/`UPDATE` | No (use subquery) | Yes | Batch deletes differ |
| Sequences | Yes | `auto_increment` only | |
| Full-text | `tsvector` with dictionaries, `pg_trgm` | `FULLTEXT` | Postgres is richer |
| `EXPLAIN` | `EXPLAIN (ANALYZE, BUFFERS)` | `EXPLAIN ANALYZE`, `EXPLAIN FORMAT=JSON` | Both show actual timings in current versions |
| Extensions | Rich ecosystem | None comparable | A reason to prefer Postgres for geo/vector/search |
| FK index | Manual | Automatic | Postgres needs the explicit index |

## Portable patterns

- App-generated UUID v7 primary keys.
- Explicit `created_at`/`updated_at` maintained by the ORM.
- `varchar` + `CHECK` for enums.
- Child tables instead of arrays.
- Keyset pagination with `(sort_col, id)` row-value comparison.
- Drizzle's dialect-specific helpers only inside the repository layer.

## Related

- [../../23-decision-guides/databases.md](../../23-decision-guides/databases.md)
- [../../04-drizzle-orm/mysql.md](../../04-drizzle-orm/mysql.md)
