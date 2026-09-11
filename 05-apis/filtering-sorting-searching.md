# Filtering, sorting, searching

## Filtering

```text
GET /files?folderId=abc&mimeType=image/png&trashed=false
GET /audit-logs?actorUserId=…&from=2026-09-01T00:00:00Z&to=2026-09-11T00:00:00Z
GET /users?status=active,invited          (comma list → IN)
```

- One query parameter per field, named after the field.
- Ranges as `from`/`to` (or `<field>From`/`<field>To` when several ranges exist).
- Lists as comma-separated values, parsed and bounded.
- Every filterable field is declared in the Zod query schema; unknown fields are ignored (or rejected in strict admin APIs).
- Filters map to indexed columns. Offering a filter on an unindexed column on a large table is a self-inflicted outage.

Avoid generic filter languages (`?filter[status][eq]=active`, JSON in query
strings) unless the product is an admin/reporting tool that really needs them.

## Sorting

```text
GET /users?sort=name&order=asc
GET /files?sort=-createdAt             (alternative: leading minus for desc)
```

- `sort` is validated against an allow-list per endpoint: `z.enum(['name', 'createdAt', 'sizeBytes'])`.
- Every sort has a stable tiebreaker (`id`) added server-side.
- Sortable fields are indexed in the direction offered (or both if both are offered).
- Pick one syntax (`sort` + `order`, or `-field`) for the whole API.

## Searching

```text
GET /files?q=report              (substring/prefix on name, scoped to the caller)
GET /users/search?q=ani          (type-ahead; small limit; debounced client)
GET /documents?q=quarterly+revenue   (full-text with ranking)
```

- `q` is the conventional parameter.
- Minimum length (2-3 chars) for substring search; return 400 or an empty list below it.
- Small fixed `limit` (10-20) for type-ahead.
- Backed by the right index: B-tree for prefix, `pg_trgm` GIN for substring, `tsvector` GIN for full-text ([03-databases/postgres/full-text-search.md](../03-databases/postgres/full-text-search.md)).
- If the whole directory is small (a few hundred rows), one `GET /users/directory` fetched once and filtered client-side beats a request per keystroke.

## Example schema

```ts
export const listFilesQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  q: z.string().trim().min(2).max(100).optional(),
  mimeType: z.string().max(100).optional(),
  sort: z.enum(['name', 'createdAt', 'sizeBytes']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(500).optional(),
});
```

## Related

- [pagination.md](pagination.md)
- [03-databases/indexing.md](../03-databases/indexing.md)
