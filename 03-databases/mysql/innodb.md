# InnoDB behaviour that shapes design

## Clustered primary key

InnoDB stores the table **physically ordered by primary key**. Every
secondary index stores the primary key value as the row pointer.

Consequences:

- **Random PKs (UUID v4) are expensive**: inserts land in random pages, causing splits and cache misses. Use `bigint auto_increment`, UUID v7, or ULID.
- **Wide PKs make every secondary index wide.** Keep the PK small (8-16 bytes).
- **Range scans by PK are fast** (rows are adjacent). Time-ordered keys give time-ordered storage for free.
- A secondary-index lookup is two steps: find the PK in the secondary index, then find the row by PK in the clustered index. Covering indexes (all needed columns in the secondary index) skip the second step.

```sql
create table files (
  id            bigint unsigned auto_increment primary key,
  public_id     binary(16) not null unique,     -- UUID for the API, generated in the app
  owner_id      bigint unsigned not null,
  ...
  index idx_files_owner_created (owner_id, created_at desc),
  constraint fk_files_owner foreign key (owner_id) references users(id) on delete restrict
) engine=innodb;
```

## Foreign keys

InnoDB **creates an index automatically** for each FK if a suitable one
doesn't exist. You still want composite indexes that put the FK first for
the hot queries.

## Locking

- Row-level locking, but under the default `REPEATABLE READ` isolation InnoDB also takes **gap locks** and **next-key locks** on ranges to prevent phantoms. This causes deadlocks that Postgres users don't expect, especially on `INSERT ... WHERE NOT EXISTS` patterns and range `UPDATE`s.
- Consider `READ COMMITTED` for OLTP workloads with many concurrent inserts (fewer gap locks). Set per session or globally: `SET GLOBAL transaction_isolation = 'READ-COMMITTED'`.
- `SELECT ... FOR UPDATE` and `FOR UPDATE SKIP LOCKED` (8.0+) work as in Postgres.
- Deadlock detection is on; retry on error `1213`.

## Online DDL

Most `ALTER TABLE` operations (add column, add index) are online
(`ALGORITHM=INPLACE, LOCK=NONE`) in 8.0. Specify them explicitly to fail
fast if an operation would lock:

```sql
alter table files add index idx_files_parent (parent_id), algorithm=inplace, lock=none;
```

Changing a column type or PK usually rebuilds the table; use expand/contract
([../migrations.md](../migrations.md)) or `pt-online-schema-change`/`gh-ost`
for huge tables.

## Settings that matter

| Setting | Guidance |
| --- | --- |
| `innodb_buffer_pool_size` | 50-75% of RAM on a dedicated host (managed hosts set it) |
| `innodb_flush_log_at_trx_commit` | `1` for durability (default); `2` trades a second of durability for throughput |
| `max_connections` | Modest; pool in the app |
| `long_query_time` + `slow_query_log` | `0.2` s, on |
| `sql_mode` | Strict (see [README.md](README.md)) |

## Full-text

InnoDB `FULLTEXT` indexes support natural-language and boolean mode
(`MATCH(col) AGAINST('term' IN BOOLEAN MODE)`). Adequate for simple
search; no stemming quality comparable to Postgres's dictionaries.

## Related

- [../primary-keys.md](../primary-keys.md)
- [../locking.md](../locking.md)
- [differences-from-postgres.md](differences-from-postgres.md)
