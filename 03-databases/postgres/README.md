# PostgreSQL

The default database for new projects. Everything in
[03-databases/](../README.md) applies; this folder covers what is specific
to Postgres.

| Document | Covers |
| --- | --- |
| [data-types.md](data-types.md) | Which type to use for what; `text`, `timestamptz`, `uuid`, `citext`, `numeric`, arrays, enums. |
| [json.md](json.md) | `jsonb`: when it is appropriate, how to index and query it. |
| [full-text-search.md](full-text-search.md) | `tsvector`/`tsquery`, `pg_trgm`, when to reach for an external search engine. |
| [maintenance.md](maintenance.md) | `VACUUM`/`ANALYZE`, bloat, `pg_stat_statements`, useful settings, backups. |

## Why Postgres by default

- Strict types and constraints; partial and expression indexes; `CHECK`, exclusion constraints.
- `jsonb` with indexing for the semi-structured parts without giving up SQL.
- Recursive CTEs, window functions, `RETURNING`, `ON CONFLICT`, row-value comparisons for keyset pagination.
- Transactional DDL: a failed migration rolls back cleanly.
- Extensions: `pg_trgm`, `citext`, `pgcrypto`, `pg_stat_statements`, `postgis`, `pgvector`.
- Widely hosted (Railway, Neon, Supabase, RDS, Cloud SQL) with poolers available.

## Extensions to enable on every project

```sql
create extension if not exists citext;            -- case-insensitive text (emails)
create extension if not exists pg_stat_statements; -- find slow queries (needs shared_preload_libraries on self-hosted)
create extension if not exists pg_trgm;           -- substring search, only if needed
```

`gen_random_uuid()` is built in since PG 13; no `pgcrypto`/`uuid-ossp` needed for UUIDs.
