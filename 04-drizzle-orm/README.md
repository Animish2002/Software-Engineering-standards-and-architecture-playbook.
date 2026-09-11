# 04 — Drizzle ORM

Drizzle is a typed SQL builder with a schema-as-code layer and migration
tooling. It does not hide SQL; that is why it's the recommended ORM here.
Database design rules live in [03-databases/](../03-databases/README.md);
this section is about expressing them in Drizzle and querying well.

| Document | Answers |
| --- | --- |
| [setup.md](setup.md) | Package layout, client, config, scripts. |
| [schema.md](schema.md) | Declaring tables, columns, defaults, constraints, enums; organising schema files. |
| [relations.md](relations.md) | `relations()` for the relational query API; FKs vs relations. |
| [migrations.md](migrations.md) | `generate` / `migrate` / `push`; custom SQL; production flow. |
| [queries.md](queries.md) | Select builder vs relational queries; filters; joins; pagination; inserts/updates/upserts. |
| [transactions.md](transactions.md) | `db.transaction`, passing `tx`, isolation, retries. |
| [indexing.md](indexing.md) | Declaring indexes (composite, unique, partial, expression). |
| [prepared-statements.md](prepared-statements.md) | When and how. |
| [repository-pattern.md](repository-pattern.md) | Query modules without over-abstraction. |
| [performance.md](performance.md) | N+1, column selection, batching, logging. |
| [mysql.md](mysql.md) | Differences when targeting MySQL. |
| [best-practices.md](best-practices.md) | The consolidated do/don't list. |

## Decision: Drizzle vs raw SQL vs a heavier ORM

| Choose | When |
| --- | --- |
| **Drizzle** (default) | You want typed schema, migrations, and a query builder that maps 1:1 to SQL you can read in `EXPLAIN`. |
| Raw SQL (`sql` template inside Drizzle) | Recursive CTEs, window functions, full-text, anything the builder expresses awkwardly. Keep it inside repositories. |
| Heavier ORM (Prisma, TypeORM) | Not recommended for these stacks: more magic between you and the plan, harder to optimise. |

See [23-decision-guides/databases.md](../23-decision-guides/databases.md) ("SQL query vs ORM query").
