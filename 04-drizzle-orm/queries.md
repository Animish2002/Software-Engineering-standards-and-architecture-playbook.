# Drizzle queries

## Reads

```ts
import { eq, and, or, isNull, inArray, desc, asc, lt, sql, count, sum } from 'drizzle-orm';

// explicit columns (recommended over .select() with no args)
const rows = await db
  .select({ id: files.id, name: files.name, sizeBytes: files.sizeBytes, createdAt: files.createdAt })
  .from(files)
  .where(and(eq(files.ownerId, ownerId), eq(files.parentId, parentId), isNull(files.trashedAt)))
  .orderBy(desc(files.createdAt), desc(files.id))
  .limit(51);

// one row
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
// or relational
const user = await db.query.users.findFirst({ where: eq(users.id, id), columns: { passwordHash: false } });
```

### Conditional filters

```ts
const conditions = [eq(files.ownerId, ownerId), isNull(files.trashedAt)];
if (parentId) conditions.push(eq(files.parentId, parentId)); else conditions.push(isNull(files.parentId));
if (q) conditions.push(ilike(files.name, `%${q}%`));
await db.select().from(files).where(and(...conditions));
```

### Joins and aggregates

```ts
const folderSizes = await db
  .select({ folderId: files.parentId, total: sum(files.sizeBytes).mapWith(Number), n: count() })
  .from(files)
  .where(and(eq(files.ownerId, ownerId), isNull(files.trashedAt), inArray(files.parentId, folderIds)))
  .groupBy(files.parentId);
```

### Keyset pagination

```ts
const page = await db.select(cols).from(files)
  .where(and(
    eq(files.ownerId, ownerId), isNull(files.trashedAt),
    cursor ? sql`(${files.createdAt}, ${files.id}) < (${cursor.createdAt}, ${cursor.id})` : undefined,
  ))
  .orderBy(desc(files.createdAt), desc(files.id))
  .limit(pageSize + 1);
const hasMore = page.length > pageSize;
const items = hasMore ? page.slice(0, pageSize) : page;
```

`and()` ignores `undefined`, which makes optional clauses clean.

### Raw SQL where the builder is awkward

```ts
const crumbs = await db.execute<{ id: string; name: string; depth: number }>(sql`
  with recursive crumbs as (
    select id, parent_id, name, 1 as depth from folders where id = ${folderId} and owner_id = ${ownerId}
    union all
    select f.id, f.parent_id, f.name, c.depth + 1 from folders f join crumbs c on f.id = c.parent_id where c.depth < 64
  )
  select id, name, depth from crumbs order by depth desc
`);
```

`db.execute` returns raw rows (`snake_case`, strings for bigints): map them
explicitly at the repository boundary. Parameters interpolated with the
`sql` tag are bound, never concatenated, so this is injection-safe.

## Writes

```ts
// insert, returning the row
const [file] = await db.insert(files).values({ ownerId, parentId, name, mimeType, sizeBytes, storageKey }).returning();

// multi-row insert (one statement)
await db.insert(permissions).values(keys.map((key) => ({ key })));

// upsert
await db.insert(stars).values({ userId, resourceId, resourceType })
  .onConflictDoNothing({ target: [stars.userId, stars.resourceId] });

await db.insert(settings).values({ userId, theme })
  .onConflictDoUpdate({ target: settings.userId, set: { theme, updatedAt: new Date() } });

// update with a scope, returning
const [updated] = await db.update(files)
  .set({ name, updatedAt: new Date() })
  .where(and(eq(files.id, id), eq(files.ownerId, ownerId)))
  .returning();
if (!updated) throw new NotFoundError('File', id);      // scope + not-found in one round trip

// atomic counter
await db.update(users).set({ unreadCount: sql`${users.unreadCount} + 1` }).where(eq(users.id, userId));

// delete (hard) with scope
await db.delete(refreshTokens).where(and(eq(refreshTokens.userId, userId), lt(refreshTokens.expiresAt, new Date())));
```

## Rules

- Always scope writes by owner/tenant in the `WHERE`, and use `.returning()` to learn whether anything matched.
- Explicit column lists on hot reads.
- Prefer one statement (`inArray`, multi-row insert, join) over loops.
- Keep `sql` raw fragments inside repositories, never in controllers.
- Map `db.execute` rows to camelCase types at the repository boundary.

## Related

- [03-databases/query-optimization.md](../03-databases/query-optimization.md)
- [03-databases/pagination.md](../03-databases/pagination.md)
- [performance.md](performance.md)
