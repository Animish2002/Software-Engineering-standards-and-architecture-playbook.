# Database decisions

## PostgreSQL vs MySQL

```text
Existing team expertise or infrastructure already on MySQL?
  │
  ├── Yes, and no strong reason to switch ──────────────► MySQL (see 03-databases/mysql/)
  │
  └── No / greenfield
       │
       Need any of: partial indexes, rich JSONB querying/indexing,
       array columns, full-text search with real dictionaries,
       exclusion constraints, extensions (pg_trgm, PostGIS, pgvector)?
       │
       ├── Yes ─────────────────────────────────────────► PostgreSQL
       └── No, plain relational CRUD either way ─────────► PostgreSQL (the default; see why below)
```

**Default to PostgreSQL** unless there's a concrete reason for MySQL
(existing team/infra expertise, a managed platform that only offers
MySQL, e.g. PlanetScale-specific features). Postgres's stricter typing,
partial/expression indexes, transactional DDL, and richer JSON support
remove entire categories of workaround this playbook would otherwise need
to document twice. Full comparison: [03-databases/mysql/differences-from-postgres.md](../03-databases/mysql/differences-from-postgres.md).

## SQL query vs ORM query (Drizzle)

```text
Is it a straightforward filter/join/insert/update the builder expresses
clearly and that you'd want type-checked?
  │
  ├── Yes ─────────────────────────────────────────────► Drizzle query builder
  │
  └── No — it's a recursive CTE, window function, full-text search,
      or something the builder makes awkward or opaque
       │
       └── Yes ─────────────────────────────────────────► Raw `sql` tag, inside the repository only
```

Both are "Drizzle" — the `sql` template tag is part of the same library
and still parameterises safely. The decision is really "builder vs raw
SQL," not "ORM vs SQL." See [04-drizzle-orm/queries.md](../04-drizzle-orm/queries.md).
Never reach for a heavier ORM (Prisma, TypeORM) to avoid writing SQL —
that trades a small amount of builder verbosity for a much larger amount
of distance between your code and the query plan you're trying to reason
about.

## Offset vs cursor (keyset) pagination

```text
Does the UI need "jump to page 7" / a total count, on a table that
stays small (hundreds to low thousands of rows, admin-facing)?
  │
  ├── Yes ─────────────────────────────────────────────► Offset pagination
  │
  └── No — it's a feed, an infinite-scroll list, a large or
      unbounded table, or consumed by another service
       │
       └── Yes ─────────────────────────────────────────► Cursor (keyset) pagination
```

Cursor pagination has constant cost regardless of how deep you page;
offset pagination gets slower the further in you go (`OFFSET 100000` scans
and discards 100,000 rows every time). Full detail:
[03-databases/pagination.md](../03-databases/pagination.md),
[05-apis/pagination.md](../05-apis/pagination.md).

## Redis vs database caching

```text
Is the cache shared across multiple app instances AND does it need
sub-millisecond reads at high volume (sessions, rate-limit counters,
hot computed values read on every request)?
  │
  ├── Yes ─────────────────────────────────────────────► Redis (or KV on Workers)
  │
  └── No
       │
       Single instance, or staleness of a few seconds is fine?
       │
       ├── Yes ─────────────────────────────────────────► In-process TTL map
       └── Needs to survive restarts / be queryable ─────► A Postgres table (even "cache" tables are fine at moderate volume)
```

Introduce Redis only after an in-process cache and query optimisation
have both been tried and measured insufficient — it's another stateful
service to run, secure, and pay for. Full detail:
[17-performance/caching.md](../17-performance/caching.md).

## When to add an index

```text
Is this column (or column combination) used in a WHERE, JOIN ON,
or ORDER BY on a query that runs often, against a table that will
grow past a few thousand rows?
  │
  ├── No ──────────────────────────────────────────────► Don't add one yet
  │
  └── Yes
       │
       Is it a foreign key column? ───────────────────► Always index it (Postgres doesn't do this automatically)
       Is it always filtered alongside a fixed
       predicate (is_trashed = false)?  ───────────────► Composite index, consider making it partial
       Is it low-selectivity alone (a boolean,
       a 2-3 value enum) with no other predicate? ─────► Don't index it alone — combine with a selective column instead
```

Verify with `EXPLAIN (ANALYZE, BUFFERS)` at realistic data volume before
and after — see [03-databases/indexing.md](../03-databases/indexing.md)
and [03-databases/explain.md](../03-databases/explain.md).

## Related

- [../03-databases/README.md](../03-databases/README.md)
- [../04-drizzle-orm/README.md](../04-drizzle-orm/README.md)
