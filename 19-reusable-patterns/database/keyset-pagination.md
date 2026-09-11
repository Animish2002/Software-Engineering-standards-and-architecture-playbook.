# Keyset pagination (SQL)

```sql
-- index that serves the scoped, ordered, keyset query
create index idx_files_owner_created_id on files (owner_id, created_at desc, id desc) where not is_trashed;

-- first page
select id, name, size_bytes, created_at
from files
where owner_id = $1 and not is_trashed
order by created_at desc, id desc
limit 51;

-- next page (cursor = last row's created_at, id)
select id, name, size_bytes, created_at
from files
where owner_id = $1 and not is_trashed
  and (created_at, id) < ($2, $3)
order by created_at desc, id desc
limit 51;

-- previous page (reverse the comparison and order, then reverse the rows in the app)
select * from (
  select id, name, size_bytes, created_at
  from files
  where owner_id = $1 and not is_trashed and (created_at, id) > ($2, $3)
  order by created_at asc, id asc
  limit 51
) p order by created_at desc, id desc;
```

Sorting by another column (e.g., `name`) needs its own index
`(owner_id, name asc, id asc)` and a cursor of `(name, id)`; the cursor
encodes which sort it belongs to so a sort change invalidates it.

`EXPLAIN` should show `Index Scan using idx_files_owner_created_id` with
`Limit`, no `Sort`.

Related: [03-databases/pagination.md](../../03-databases/pagination.md), [../backend/pagination.md](../backend/pagination.md)
