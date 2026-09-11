# Locking and concurrency

## What is it?

How the database prevents two concurrent transactions from corrupting each
other, and the tools you use to make a read-then-write safe.

## Row locks

```sql
-- pessimistic: lock the row until commit; other writers wait
select * from users where id = $1 for update;

-- skip rows someone else holds (job queues, "claim the next item")
select * from jobs where run_at <= now() and locked_at is null
order by run_at limit 1 for update skip locked;

-- fail fast instead of waiting
select * from users where id = $1 for update nowait;

-- weaker lock: blocks writers, allows other share-locks (rarely needed)
select ... for share;
```

Use `FOR UPDATE` when the write depends on the read (quota check, balance,
state transition). It serializes only the rows involved.

## Optimistic concurrency

For user-facing edits where two people may edit the same record: a version
column, compare on write.

```sql
alter table documents add column version int not null default 1;
update documents set body = $2, version = version + 1, updated_at = now()
where id = $1 and version = $3;      -- 0 rows updated → someone else saved first → 409
```

No lock held between read and write; conflicts surface as a 409 the UI can
handle ("reload and retry"). Prefer this over locks when the gap between read
and write includes a human.

## Atomic single statements

Many "read-then-write" cases are a single statement:

```sql
update users set unread_count = unread_count + 1 where id = $1;               -- no read needed
insert into stars (user_id, resource_id) values ($1, $2) on conflict do nothing;   -- idempotent
update jobs set attempts = attempts + 1, locked_at = now() where id = $1 and locked_at is null returning *;
```

## Deadlocks

Two transactions each wait for a lock the other holds. The database detects
it and aborts one (`40P01` Postgres, `1213` MySQL).

Prevent: **acquire locks in a consistent order** (e.g., always lower id
first when locking two rows; always parent before child). Keep transactions
short. Handle: retry the aborted transaction a bounded number of times.

```ts
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (!isRetryable(err) || i === attempts) throw err;   // 40001, 40P01
      await new Promise((r) => setTimeout(r, 25 * 2 ** i));
    }
  }
}
```

## Lock contention symptoms

- Requests slow only under load; `EXPLAIN` looks fine. Check `pg_stat_activity` for `wait_event_type = 'Lock'`.
- A hot row updated by every request (a global counter). Shard it, batch it, or move it to an in-memory/KV counter.
- Long transactions (an open transaction waiting on an HTTP call) holding locks.

## Schema locks

DDL takes strong locks. Adding a column with a default is fast in modern
Postgres; adding a `NOT NULL` constraint, an index (non-concurrently), or
rewriting a column type blocks writes. See [migrations.md](migrations.md).

## Checklist

- [ ] Read-then-write paths use `FOR UPDATE`, a version column, or an atomic statement.
- [ ] Queue-style "claim" uses `SKIP LOCKED`.
- [ ] Locks acquired in a consistent order.
- [ ] Retry on `40001`/`40P01`, bounded.
- [ ] No network calls inside transactions.

## Related

- [transactions.md](transactions.md)
- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
