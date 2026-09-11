# Full-text and fuzzy search in PostgreSQL

## Options

| Need | Tool | Index |
| --- | --- | --- |
| Prefix match (`name like 'rep%'`) | B-tree | Plain index on the column (`text_pattern_ops` if collation isn't C) |
| Substring / typo-tolerant match (`'%rep%'`, similarity) | `pg_trgm` | `GIN (col gin_trgm_ops)` |
| Word-based search with ranking and stemming | Built-in full-text (`tsvector`/`tsquery`) | `GIN (search_vector)` |
| Faceting, relevance tuning, multi-language, huge corpora | External engine (Meilisearch, Typesense, OpenSearch) | Separate service (optional tier) |

Start with Postgres. Add an external engine only when relevance tuning or
scale is a measured problem.

## Trigram (substring) search

```sql
create extension if not exists pg_trgm;
create index idx_files_name_trgm on files using gin (name gin_trgm_ops);

select id, name from files
where owner_id = $1 and deleted_at is null and name ilike '%' || $2 || '%'
order by similarity(name, $2) desc limit 20;
```

Good for file names, user names, SKUs. Query strings under 3 characters
won't use the index well; require a minimum length in the API.

## Full-text search

```sql
alter table documents add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored;
create index idx_documents_search on documents using gin (search_vector);

select id, title, ts_rank(search_vector, q) as rank
from documents, websearch_to_tsquery('english', $1) q
where search_vector @@ q
order by rank desc limit 20;
```

- `websearch_to_tsquery` accepts user-style input (`"exact phrase" -excluded`).
- A **generated column** keeps the vector correct without triggers.
- Combine with the usual scoping filters (`owner_id`) so the index does most of the work.

## Drizzle

Full-text needs raw SQL for the generated column and the `@@` operator:

```ts
searchVector: customType<{ data: string }>({ dataType: () => 'tsvector' })('search_vector')
  .generatedAlwaysAs(sql`to_tsvector('english', coalesce(title, ''))`),
// query
db.select().from(documents).where(sql`${documents.searchVector} @@ websearch_to_tsquery('english', ${q})`)
```

## Related

- [../indexing.md](../indexing.md)
- [../query-optimization.md](../query-optimization.md)
