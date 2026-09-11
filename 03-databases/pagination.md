# Pagination

## Offset vs keyset

| | Offset (`LIMIT/OFFSET`) | Keyset / cursor (`WHERE (sort_col, id) < (?, ?)`) |
| --- | --- | --- |
| Query | `order by created_at desc, id desc limit 50 offset 200` | `where (created_at, id) < ($1, $2) order by created_at desc, id desc limit 50` |
| Cost | Reads and discards `offset` rows; grows linearly with page number | Constant: index seek to the cursor, read 50 |
| Jump to page N | Yes | No (next/previous only) |
| Stable under inserts/deletes | No (rows shift; duplicates or skips) | Yes |
| Total count | Natural (`count(*)`, itself expensive) | Separate query or omitted |
| Needs | Any index on the sort | Composite index on `(sort_col, id)` with matching direction |
| Use for | Admin tables, small result sets, "page 3 of 12" UIs | Feeds, infinite scroll, large tables, APIs consumed by machines |

**Default:** keyset for anything user-facing and potentially large; offset
for admin tables with a page-number UI and bounded size. See
[23-decision-guides/databases.md](../23-decision-guides/databases.md).

## Keyset implementation

The sort key must be **unique and stable**: `(created_at, id)`, never
`created_at` alone (ties would skip or repeat rows).

```sql
create index idx_files_owner_created_id on files (owner_id, created_at desc, id desc) where deleted_at is null;

-- first page
select id, name, created_at from files
where owner_id = $1 and deleted_at is null
order by created_at desc, id desc limit 51;          -- fetch one extra to know if there is a next page

-- next page: cursor = (created_at, id) of the last row shown
select id, name, created_at from files
where owner_id = $1 and deleted_at is null
  and (created_at, id) < ($2, $3)                    -- row-value comparison; Postgres and MySQL 8 both support it
order by created_at desc, id desc limit 51;
```

Encode the cursor as opaque base64url JSON so clients don't construct it:

```ts
const encodeCursor = (row) => Buffer.from(JSON.stringify([row.createdAt.toISOString(), row.id])).toString('base64url');
const decodeCursor = (s) => cursorSchema.parse(JSON.parse(Buffer.from(s, 'base64url').toString()));
```

API shape:

```json
{ "success": true, "data": { "items": [...], "nextCursor": "eyJ...", "hasMore": true } }
```

## Offset implementation

```sql
select id, name from users order by created_at desc, id desc limit $1 offset $2;
select count(*) from users;   -- only if the UI needs a total; cache or estimate for big tables
```

Cap `pageSize` (≤ 100) and `page` (a page number of 100,000 is a scan; reject or clamp).

API shape:

```json
{ "success": true, "data": { "items": [...], "page": 3, "pageSize": 50, "total": 1234 } }
```

## Common mistakes

- Keyset on a non-unique column.
- Cursor built from client-supplied raw values without validation.
- Sorting by a column that isn't in the index (falls back to a full sort).
- `count(*)` on every page request of a million-row table.
- Different pagination shapes across endpoints. Pick one per style and put the parser in a shared helper ([19-reusable-patterns/backend/pagination.md](../19-reusable-patterns/backend/pagination.md)).

## Related

- [indexing.md](indexing.md)
- [05-apis/pagination.md](../05-apis/pagination.md)
- [04-drizzle-orm/queries.md](../04-drizzle-orm/queries.md)
