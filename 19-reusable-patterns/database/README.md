# Database patterns

| File | Purpose |
| --- | --- |
| [soft-delete.md](soft-delete.md) | Columns, partial indexes, the single active filter, trash/restore functions |
| [keyset-pagination.md](keyset-pagination.md) | The SQL and index for `(created_at, id)` keyset paging |
| [audit-log.md](audit-log.md) | Table, index, never-throwing writer |
| [updated-at-trigger.md](updated-at-trigger.md) | Postgres trigger so `updated_at` is right even for raw SQL |
