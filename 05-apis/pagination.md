# Pagination (API contract)

Database mechanics are in [03-databases/pagination.md](../03-databases/pagination.md).
Choose per endpoint using [23-decision-guides/databases.md](../23-decision-guides/databases.md).

## Cursor (keyset): default for feeds, large lists, infinite scroll

```text
GET /files?folderId=…&limit=50
GET /files?folderId=…&limit=50&cursor=eyJjIjoiMjAyNi0…
```

```json
{ "success": true, "data": { "items": [ ... ], "nextCursor": "eyJ…", "hasMore": true } }
```

- `cursor` is opaque (base64url of the sort key); the server validates it and returns 400 for a malformed one.
- `limit` defaults to 50, max 100.
- Sort is fixed per endpoint (or selectable from a declared set); the cursor encodes it so changing sort invalidates old cursors.
- No `total`. If the UI needs a count, add a separate cached endpoint.

## Offset: admin tables, small bounded sets, page-number UIs

```text
GET /users?page=3&pageSize=50&sort=name&order=asc
```

```json
{ "success": true, "data": { "items": [ ... ], "page": 3, "pageSize": 50, "total": 1234, "totalPages": 25 } }
```

- `page` starts at 1; `pageSize` max 100.
- `total` is expensive on big tables; cap `page` (e.g., 1000) or switch to cursor when the table grows.

## Rules

- Every list endpoint paginates, even ones that "will always be small". Defaults make it invisible to the client until needed.
- One shared parser (`parsePagination(query)`) and one shared response helper so shapes never drift ([19-reusable-patterns/backend/pagination.md](../19-reusable-patterns/backend/pagination.md)).
- The frontend has one `usePaginatedQuery`/`useInfiniteQuery` hook per style ([10-frontend/api-integration.md](../10-frontend/api-integration.md)).

## Related

- [filtering-sorting-searching.md](filtering-sorting-searching.md)
