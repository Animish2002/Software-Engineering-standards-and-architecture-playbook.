# PostgreSQL maintenance and settings

## Statistics and vacuum

- **`ANALYZE`** updates the statistics the planner uses. Autovacuum runs it, but after a bulk load or a big migration run `ANALYZE <table>` yourself.
- **`VACUUM`** reclaims dead tuples left by updates/deletes and keeps the visibility map current (needed for index-only scans). Autovacuum handles it; check it isn't falling behind on hot tables:

```sql
select relname, n_dead_tup, n_live_tup, last_autovacuum, last_autoanalyze
from pg_stat_user_tables order by n_dead_tup desc limit 10;
```

- Tables with very high update rates may need per-table autovacuum tuning (`autovacuum_vacuum_scale_factor = 0.02`).

## Finding problems

```sql
-- slow queries (needs pg_stat_statements)
select calls, round(mean_exec_time::numeric,1) mean_ms, round(total_exec_time::numeric) total_ms, left(query,120)
from pg_stat_statements order by total_exec_time desc limit 20;

-- what is running / waiting right now
select pid, now() - query_start as age, state, wait_event_type, left(query, 100)
from pg_stat_activity where state <> 'idle' order by age desc;

-- unused indexes
select indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
from pg_stat_user_indexes where idx_scan = 0 order by pg_relation_size(indexrelid) desc;

-- missing FK indexes (columns ending in _id without an index) — approximate
select c.table_name, c.column_name from information_schema.columns c
where c.column_name like '%\_id' and c.table_schema = 'public'
  and not exists (select 1 from pg_indexes i where i.tablename = c.table_name and i.indexdef like '%(' || c.column_name || '%');

-- table and index sizes
select relname, pg_size_pretty(pg_total_relation_size(relid)) from pg_catalog.pg_statio_user_tables order by pg_total_relation_size(relid) desc;
```

## Settings worth knowing (managed hosts set most of these)

| Setting | Guidance |
| --- | --- |
| `shared_buffers` | ~25% of RAM (managed hosts do this) |
| `work_mem` | Per sort/hash per query; 16-64 MB is typical; too high × many connections = OOM |
| `effective_cache_size` | ~50-75% of RAM; helps the planner prefer indexes |
| `random_page_cost` | `1.1` on SSD (default 4 assumes spinning disks and discourages index scans) |
| `statement_timeout` | Set per app role (e.g., `10s`) |
| `idle_in_transaction_session_timeout` | e.g., `30s` |
| `log_min_duration_statement` | `200` ms in production for slow-query logging |
| `max_connections` | Keep modest; use a pooler rather than raising it |

## Backups

- Managed hosts: enable automated daily backups **and point-in-time recovery** if offered. Verify you can restore (do it once, to a scratch instance).
- Self-hosted: `pg_dump -Fc` nightly to object storage + WAL archiving for PITR.
- A backup that has never been restored is not a backup.

## Upgrades

- Minor versions: apply promptly (bug and security fixes, no format change).
- Major versions: test migrations and queries on a restored copy first; managed hosts usually offer in-place upgrade with a short outage.

## Related

- [../explain.md](../explain.md)
- [../connection-pooling.md](../connection-pooling.md)
