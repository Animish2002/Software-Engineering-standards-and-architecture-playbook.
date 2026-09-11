# 03 — Databases

Relational database design and performance for PostgreSQL and MySQL. ORM
specifics are in [04-drizzle-orm/](../04-drizzle-orm/README.md).

## Reading order for a new schema

```text
schema-design.md → naming-conventions.md → primary-keys.md → relationships.md
→ constraints.md → normalization.md → soft-deletes-and-audit-columns.md
→ indexing.md → migrations.md
```

## Reading order for a slow query

```text
explain.md → indexing.md → query-optimization.md → pagination.md → connection-pooling.md
```

| Document | Answers |
| --- | --- |
| [schema-design.md](schema-design.md) | How to go from requirements to tables; the reference schema. |
| [naming-conventions.md](naming-conventions.md) | Tables, columns, keys, indexes, constraints. |
| [primary-keys.md](primary-keys.md) | UUID vs auto-increment vs UUIDv7. |
| [relationships.md](relationships.md) | One-to-one, one-to-many, many-to-many, junction tables, polymorphic references. |
| [constraints.md](constraints.md) | PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT; what the database should enforce. |
| [normalization.md](normalization.md) | Normal forms in practice. |
| [denormalization.md](denormalization.md) | When to duplicate data on purpose, and how to keep it correct. |
| [soft-deletes-and-audit-columns.md](soft-deletes-and-audit-columns.md) | `created_at`/`updated_at`, `deleted_at`, who-did-what. |
| [indexing.md](indexing.md) | What to index, what not to, composite/partial/unique/covering, leftmost prefix. |
| [explain.md](explain.md) | Reading `EXPLAIN ANALYZE`: scans, joins, sorts. |
| [query-optimization.md](query-optimization.md) | Before/after fixes for the common slow patterns. |
| [pagination.md](pagination.md) | Offset vs keyset. |
| [transactions.md](transactions.md) | ACID, isolation levels, what belongs in one transaction. |
| [locking.md](locking.md) | Row locks, deadlocks, `SKIP LOCKED`, optimistic concurrency. |
| [migrations.md](migrations.md) | Safe schema changes on a live database. |
| [connection-pooling.md](connection-pooling.md) | Pool sizing, serverless, proxies. |
| [postgres/](postgres/README.md) | Types, JSONB, full-text search, maintenance. |
| [mysql/](mysql/README.md) | Types, InnoDB, differences from Postgres. |

Checklist: [21-checklists/database-checklist.md](../21-checklists/database-checklist.md).
Decision guides: [23-decision-guides/databases.md](../23-decision-guides/databases.md).

## Non-negotiables

1. Every table has a primary key.
2. Every foreign key has a constraint **and an index**. MySQL InnoDB creates the index automatically; Postgres does not, so add it explicitly.
3. Every column that can't be null is `NOT NULL`.
4. Every business uniqueness rule is a `UNIQUE` constraint, not an application check.
5. Every schema change is a migration file in Git.
6. Every query in a hot path has been looked at with `EXPLAIN ANALYZE` at least once with realistic data volume.
