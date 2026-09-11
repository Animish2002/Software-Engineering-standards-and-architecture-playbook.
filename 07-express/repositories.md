# Express repositories

Nothing Express-specific: a repository is a module of Drizzle query
functions. The full guidance is in
[04-drizzle-orm/repository-pattern.md](../04-drizzle-orm/repository-pattern.md).

```ts
// modules/items/items.repository.ts
import { db, type DbOrTx } from '@app/db';
import { files, folders } from '@app/db/schema';
import { and, eq, isNull, desc, sum, sql } from 'drizzle-orm';

const activeFile = isNull(files.trashedAt);
const fileCols = { id: files.id, name: files.name, mimeType: files.mimeType, sizeBytes: files.sizeBytes, parentId: files.parentId, createdAt: files.createdAt, updatedAt: files.updatedAt };

export function listFiles(ownerId: string, parentId: string | null, client: DbOrTx = db) {
  return client.select(fileCols).from(files)
    .where(and(eq(files.ownerId, ownerId), parentId ? eq(files.parentId, parentId) : isNull(files.parentId), activeFile))
    .orderBy(desc(files.createdAt), desc(files.id));
}

export async function sumActiveBytes(ownerId: string, client: DbOrTx = db) {
  const [row] = await client.select({ total: sum(files.sizeBytes).mapWith(Number) }).from(files).where(and(eq(files.ownerId, ownerId), activeFile));
  return row?.total ?? 0;
}

export async function insertFile(values: NewFile, client: DbOrTx = db) {
  const [row] = await client.insert(files).values(values).returning(fileCols);
  return row!;
}

export async function findFolderByName(ownerId: string, parentId: string | null, name: string, client: DbOrTx = db) {
  const [row] = await client.select({ id: folders.id }).from(folders)
    .where(and(eq(folders.ownerId, ownerId), parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId), eq(folders.name, name), isNull(folders.trashedAt)))
    .limit(1);
  return row;
}
```

## Keep in mind

- Owner/tenant scope is always a parameter and always in the `WHERE`.
- Sensitive columns excluded by default via a column map.
- No domain errors; return `undefined`/`0`/`[]`.
- `client: DbOrTx = db` on every function.
- Raw `sql` fragments (CTEs, full-text) stay here.

## Related

- [04-drizzle-orm/queries.md](../04-drizzle-orm/queries.md)
- [16-testing/database-testing.md](../16-testing/database-testing.md)
