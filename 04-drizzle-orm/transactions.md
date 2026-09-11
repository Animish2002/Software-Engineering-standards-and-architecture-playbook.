# Drizzle transactions

```ts
const result = await db.transaction(async (tx) => {
  const [owner] = await tx.select().from(users).where(eq(users.id, ownerId)).for('update');
  const [{ used }] = await tx.select({ used: sum(files.sizeBytes).mapWith(Number) })
    .from(files).where(and(eq(files.ownerId, ownerId), isNull(files.trashedAt)));
  if ((used ?? 0) + sizeBytes > owner.storageQuotaBytes) throw new QuotaExceededError();
  const [file] = await tx.insert(files).values({ ... }).returning();
  return file;
}, { isolationLevel: 'read committed' });   // default; 'serializable' when needed
```

- Throw to roll back; return to commit. Domain errors thrown inside propagate out unchanged.
- `tx.transaction(...)` inside creates a **savepoint**, not a new transaction.
- `tx.rollback()` throws a `TransactionRollbackError` you can catch outside if you need "abort without an error result".

## Passing `tx` through repositories

```ts
// packages/db/src/client.ts
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;

// repository
export function insertFile(values: NewFile, client: DbOrTx = db) {
  return client.insert(files).values(values).returning();
}

// service
await db.transaction(async (tx) => {
  await filesRepo.insertFile(v, tx);
  await auditRepo.insert(a, tx);
});
```

The service decides the boundary; repositories are agnostic.

## Retrying serialization failures

```ts
export async function withSerializableRetry<T>(fn: (tx: Tx) => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await db.transaction(fn, { isolationLevel: 'serializable' }); }
    catch (err: any) {
      const code = err?.cause?.code ?? err?.code;
      if ((code !== '40001' && code !== '40P01') || i === attempts) throw err;
      await new Promise((r) => setTimeout(r, 20 * 2 ** i));
    }
  }
}
```

## Don't

- `await fetch()` or send email inside the callback.
- Open a transaction for a single statement.
- Catch errors inside and continue issuing statements (Postgres aborts the transaction; everything after fails).
- Hold `tx` in a module-level variable.

## Related

- [03-databases/transactions.md](../03-databases/transactions.md)
- [03-databases/locking.md](../03-databases/locking.md)
