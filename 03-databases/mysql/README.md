# MySQL

Use MySQL 8 with InnoDB when the organisation already runs it or the team
knows it well. Everything in [03-databases/](../README.md) applies; this
folder covers the differences that affect design and queries.

| Document | Covers |
| --- | --- |
| [data-types.md](data-types.md) | Type choices, `utf8mb4`, collations, `datetime` vs `timestamp`. |
| [innodb.md](innodb.md) | Clustered primary keys, secondary indexes, locking behaviour, settings. |
| [differences-from-postgres.md](differences-from-postgres.md) | The list of things that work differently, with the MySQL equivalent. |

## Defaults for a new MySQL project

```sql
create database app character set utf8mb4 collate utf8mb4_0900_ai_ci;
set global sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,ONLY_FULL_GROUP_BY';
set global time_zone = '+00:00';
```

- `utf8mb4` always (`utf8` in MySQL is a 3-byte subset that rejects emoji).
- Strict SQL mode so out-of-range values error instead of being silently truncated.
- UTC server time zone.
- InnoDB for every table (the default; never MyISAM).

## Drizzle

`drizzle-orm/mysql2` with the `mysql2` driver; schema helpers from
`drizzle-orm/mysql-core`. Notable: no `RETURNING` (Drizzle returns
`insertId`; use a second `SELECT` or generate ids in the app), no partial
indexes, `serial`/`bigint autoincrement` or app-generated UUIDs stored as
`binary(16)`.
