# Repository pattern with Drizzle

## What is it?

A module of named query functions per table or aggregate
(`users.repository.ts`), so that services call `findByEmail(email)` instead
of building SQL inline. Not a class, not an interface, not a generic base.

## Why does it matter?

- Query shapes live in one place per table, so a schema change is one edit.
- Services read as business logic, not SQL.
- Hot queries can be tuned (indexes, prepared statements, explicit columns) without touching callers.

## When should I NOT use it?

- One-off scripts.
- A trivial read with a single caller and no rule: a service may query directly. Promote when a second caller appears. Be consistent within a module.

## Recommended shape

```ts
// modules/users/users.repository.ts
import { db, type DbOrTx } from '@app/db';
import { users, type User, type NewUser } from '@app/db/schema';

const publicColumns = { id: users.id, email: users.email, name: users.name, storageQuotaBytes: users.storageQuotaBytes, createdAt: users.createdAt };
const active = isNull(users.trashedAt);

export async function findById(id: string, client: DbOrTx = db) {
  const [row] = await client.select(publicColumns).from(users).where(and(eq(users.id, id), active)).limit(1);
  return row;                                             // undefined when not found; the service decides
}

export async function findByEmailWithHash(email: string, client: DbOrTx = db) {
  const [row] = await client.select().from(users).where(sql`lower(${users.email}) = lower(${email})`).limit(1);
  return row;
}

export async function insert(values: NewUser, client: DbOrTx = db) {
  const [row] = await client.insert(users).values(values).returning(publicColumns);
  return row;
}

export function listActive({ limit, offset }: { limit: number; offset: number }, client: DbOrTx = db) {
  return client.select(publicColumns).from(users).where(active).orderBy(asc(users.name), asc(users.id)).limit(limit).offset(offset);
}
```

Principles visible above:

- Plain exported functions; `client` parameter for transactions.
- Reusable fragments (`publicColumns`, `active`) defined once in the file.
- Sensitive columns excluded by default; a separate explicitly named function returns them.
- No domain errors thrown; return `undefined`/empty.
- Ordering always includes a tiebreaker (`id`).

## What to avoid

```ts
// Avoid: generic base repository — hides the query, invites SELECT *, one-size-fits-none
class BaseRepository<T> {
  findAll(filter: Partial<T>) { /* builds a where from an object */ }
  findOne(id: string) { /* SELECT * */ }
}
class UserRepository extends BaseRepository<User> {}
```

- Generic `findAll(filter)` methods that accept arbitrary column filters. Every real query has a specific shape and a specific index; write it.
- Repositories that call other repositories (compose in the service).
- Repositories that accept `req`.
- Interfaces with one implementation.

## Testing

Test repositories against a real database (a Docker Postgres in CI), not
with mocks. The value of the repository is the SQL; mocking it tests
nothing. See [16-testing/database-testing.md](../16-testing/database-testing.md).

## Related

- [02-backend/layers.md](../02-backend/layers.md)
- [01-project-architecture/clean-and-hexagonal.md](../01-project-architecture/clean-and-hexagonal.md)
- [23-decision-guides/code-organization.md](../23-decision-guides/code-organization.md) ("service vs repository")
