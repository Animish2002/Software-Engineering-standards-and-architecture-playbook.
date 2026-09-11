# Denormalization

## What is it?

Deliberately storing a derived or duplicated value to make a read cheap,
accepting the cost of keeping it correct on write.

## When should I use it?

- A read is hot, measured slow, and the aggregate/join is the cause (folder size across thousands of files, unread count, follower count).
- The value is a **historical snapshot** that must not change when the source does (price at order time, actor name in an audit row).
- A search needs a precomputed form (`search_vector` for full-text).

## When should I NOT use it?

- Before `EXPLAIN ANALYZE` shows the join/aggregate is the problem.
- When a correct index or a recursive CTE solves it (folder sizes over a tree are usually fine as a CTE with indexes until tens of thousands of rows per user).
- For values that must be exactly consistent with their source at every instant and are written from many places.

## Techniques

| Technique | Kept correct by | Consistency | Use for |
| --- | --- | --- | --- |
| **Snapshot column** | Written once, never updated | Exact by definition | Prices, names in history, addresses on invoices |
| **Counter/aggregate column** | Updated in the same transaction as the source change | Exact if every writer does it | `unread_count`, `file_count` |
| **Trigger-maintained column** | Database trigger | Exact, independent of app code | Same as above when writers are many |
| **Materialized view** | `REFRESH MATERIALIZED VIEW [CONCURRENTLY]` on a schedule | Stale by up to the interval | Reports, dashboards |
| **Generated column** | Database computes from the same row | Exact | `lower(email)`, `total = qty * price` |
| **Search vector** | Generated column or trigger | Exact | Full-text search |

## Recommended approach

1. Write down the invariant: "`folders.size_bytes` equals the sum of `size_bytes` of non-trashed descendant files".
2. Choose one maintenance mechanism and put it in one place (a service function or a trigger, not both).
3. Add a **reconciliation** job or script that recomputes from source and reports drift. Run it in CI against a seeded database and periodically in production.
4. Index the denormalized column if it's filtered or sorted on.

```sql
-- generated column: always correct, no app code
alter table users add column email_normalized text generated always as (lower(email)) stored;
create unique index uq_users_email_normalized on users (email_normalized);
```

```sql
-- counter maintained in the same transaction (application code)
begin;
insert into notifications (user_id, ...) values ($1, ...);
update users set unread_count = unread_count + 1 where id = $1;
commit;
```

## Bad example

```sql
-- owner_email on files: a duplicate, not a snapshot; goes stale on rename
alter table files add column owner_email text;
```

## Common mistakes

- Updating the denormalized value in "most" code paths.
- Denormalizing across services (a copy that no transaction can keep in sync). Use events + eventual consistency and say so.
- Materialized views refreshed non-concurrently on a live table (locks readers).

## Checklist

- [ ] The slow read is measured.
- [ ] The invariant is written down next to the column.
- [ ] One maintenance mechanism.
- [ ] A reconciliation check exists.

## Related

- [normalization.md](normalization.md)
- [query-optimization.md](query-optimization.md)
- [transactions.md](transactions.md)
