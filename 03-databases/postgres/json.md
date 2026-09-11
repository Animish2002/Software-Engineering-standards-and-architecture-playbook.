# JSONB in PostgreSQL

## When should I use it?

- Payloads stored and returned whole: webhook bodies, audit `detail`, provider responses.
- User-defined or sparse attributes that vary per row and are rarely filtered on (preferences, metadata).
- Prototyping a shape you haven't settled yet, with a plan to promote stable keys to columns.

## When should I NOT use it?

- Anything you join on, aggregate on, or enforce constraints on. Make it a column.
- Relationships (`"ownerId": "..."` inside JSON instead of an FK).
- As a substitute for schema design because "it's flexible".

Rule: if you write `data->>'x'` in a `WHERE` on a hot path, `x` should be a column.

## Querying

```sql
select id from events where payload->>'type' = 'order.paid';           -- text extraction
select id from events where payload @> '{"type": "order.paid"}';        -- containment (GIN-indexable)
select id from events where (payload->'amount')::numeric > 100;         -- cast for comparison
select id from events where payload ? 'refundId';                       -- key exists
select jsonb_array_elements(payload->'items') ->> 'sku' from events;    -- unnest arrays
```

## Indexing

```sql
-- general containment/existence queries
create index idx_events_payload on events using gin (payload);
-- smaller and faster if you only use @> :
create index idx_events_payload_path on events using gin (payload jsonb_path_ops);
-- a specific key, B-tree, for equality/range on that key
create index idx_events_type on events ((payload->>'type'));
```

## Updating

```sql
update settings set data = data || '{"theme": "dark"}' where user_id = $1;                 -- merge top-level
update settings set data = jsonb_set(data, '{notifications,email}', 'false') where ...;   -- nested path
update settings set data = data - 'legacyKey' where ...;                                  -- remove key
```

Whole-document replacement from the application is simpler and usually
fine for small documents; concurrent partial updates need the operators
above (or a lock).

## Validation

Validate the JSON shape with Zod at the boundary before storing. Postgres
`CHECK` constraints on JSON paths are possible (`check (data ? 'version')`)
but keep them minimal.

## Drizzle

```ts
detail: jsonb('detail').$type<AuditDetail>(),   // typed on read/write, not validated by the DB
```

## Related

- [data-types.md](data-types.md)
- [../normalization.md](../normalization.md)
