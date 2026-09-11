# Integration testing (services + real database)

## When

- The behaviour depends on SQL: filters, joins, soft-delete, uniqueness, transactions, recursive CTEs.
- The rule spans repository + service (quota check then insert).

## Setup

- A dedicated test database: `DATABASE_URL` from `.env.test` pointing at the local Docker Postgres with a `_test` database, or a CI service container.
- Migrations applied before the run (`npm run db:migrate` with the test URL); reference seed run.
- Isolation per test: truncate the tables you touch in `beforeEach`, or wrap each test in a transaction and roll back (fast; but code that opens its own transactions needs the truncate approach).

```ts
// tests/setup.ts
import { db, pool } from '@app/db';
beforeEach(async () => { await db.execute(sql`truncate files, folders, shares, stars, users restart identity cascade`); await seedRbac(); });
afterAll(async () => { await pool.end(); });
```

## Factories

```ts
export async function createUser(overrides: Partial<NewUser> & { role?: RoleName } = {}) {
  const [user] = await db.insert(users).values({ email: `u-${randomUUID()}@test.local`, name: 'Test', passwordHash: HASH, ...overrides }).returning();
  await assignRole(user.id, overrides.role ?? 'Employee');
  return user;
}
```

Unique values per call; no shared globals.

## Examples

```ts
it('does not count trashed files toward usage', async () => {
  const u = await createUser();
  await createFile({ ownerId: u.id, sizeBytes: 100 });
  const trashed = await createFile({ ownerId: u.id, sizeBytes: 900 });
  await itemsService.trash(u.id, trashed.id);
  expect(await itemsRepo.sumActiveBytes(u.id)).toBe(100);
});

it('rejects an upload that would exceed quota, atomically', async () => {
  const u = await createUser({ storageQuotaBytes: 150 });
  await createFile({ ownerId: u.id, sizeBytes: 100 });
  await expect(itemsService.createUploadUrl(u.id, { sizeBytes: 100, ... })).rejects.toBeInstanceOf(ConflictError);
  expect(await itemsRepo.sumActiveBytes(u.id)).toBe(100);
});

it('returns breadcrumbs from root to the folder via CTE', async () => {
  const u = await createUser();
  const a = await createFolder({ ownerId: u.id, name: 'a' });
  const b = await createFolder({ ownerId: u.id, name: 'b', parentId: a.id });
  expect((await itemsService.getBreadcrumbs(u.id, b.id)).map((c) => c.name)).toEqual(['a', 'b']);
});
```

## Tips

- Test the **unique violation → 409** mapping here (create twice).
- Test soft-delete filters on every listing query at least once.
- Keep these under a second each; if not, the query is the problem (and you've found it).

## Related

- [database-testing.md](database-testing.md)
- [api-testing.md](api-testing.md)
