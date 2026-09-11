# Transactions

## What is it?

A group of statements that succeed or fail together (atomic), leave the
database consistent, run isolated from other transactions to a chosen
degree, and persist once committed (ACID).

## When should I use one?

- Multiple writes that must all happen or none: create order + order items + decrement stock.
- Read-then-write where the read must still be true at write time: check quota, then insert file.
- Any operation that touches more than one table to maintain an invariant.

## When should I NOT?

- A single statement. It is already atomic.
- Around anything that waits on the network, a queue, or a user. Locks and a pooled connection are held for the whole duration.
- To "batch" unrelated writes for speed; use a single multi-row `INSERT` instead.

## Isolation levels

| Level | Prevents | Postgres default? | Use |
| --- | --- | --- | --- |
| Read Uncommitted | Nothing (PG treats as Read Committed) | | Never |
| **Read Committed** | Dirty reads | Yes (MySQL default is Repeatable Read) | Default; each statement sees committed data as of its start |
| Repeatable Read | Non-repeatable reads; PG also prevents phantom reads via snapshot | | Reports that must see one consistent snapshot; retry on serialization failure |
| Serializable | Everything; transactions behave as if run one at a time | | Invariants spanning rows that locks can't express (e.g., "at most 3 active per user"); must retry on `40001` |

For most application code: Read Committed plus explicit row locks (`SELECT
... FOR UPDATE`) where a read-then-write must be safe. Reach for
Serializable only for a specific invariant and wrap it in a retry.

## Recommended approach

```ts
// service: transaction owns the invariant; repository functions accept the tx handle
export async function uploadFile(actorId: string, input: CreateFileInput) {
  return db.transaction(async (tx) => {
    const owner = await usersRepo.lockForUpdate(input.ownerId, tx);         // select ... for update
    const used = await filesRepo.sumActiveBytes(owner.id, tx);
    if (used + input.sizeBytes > owner.storageQuotaBytes) throw new QuotaExceededError();
    return filesRepo.insert({ ...input, ownerId: owner.id }, tx);
  });
}
```

- The **service** opens the transaction; repositories take `tx` as a parameter (defaulting to `db`).
- Throwing inside rolls back; returning commits.
- Do the side effects (email, job enqueue to an external queue) **after** commit.
- Keep it short: no `await fetch()` inside.

## Common mistakes

- Check-then-insert without a lock or unique constraint (race). Use `FOR UPDATE`, a unique constraint, or `INSERT ... ON CONFLICT`.
- Nested "transactions" that are really savepoints; know which your ORM does.
- Long transactions holding connections until the pool starves.
- Catching an error inside the transaction and continuing (Postgres aborts the transaction on any error; subsequent statements fail until rollback).
- Transactions across services or databases (not possible; use an outbox/saga).

## Production considerations

- Set `idle_in_transaction_session_timeout` (Postgres) to kill transactions left open by bugs.
- Monitor lock waits (`pg_locks`, `pg_stat_activity.wait_event`).
- Retry on serialization failure (`40001`) and deadlock (`40P01`) with bounded attempts.

## Checklist

- [ ] Every multi-table invariant is in a transaction.
- [ ] Transactions contain database work only.
- [ ] Read-then-write uses `FOR UPDATE` or a constraint.
- [ ] Repositories accept a `tx` handle.
- [ ] Side effects happen after commit.
- [ ] Timeouts configured.

## Related

- [locking.md](locking.md)
- [04-drizzle-orm/transactions.md](../04-drizzle-orm/transactions.md)
- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
