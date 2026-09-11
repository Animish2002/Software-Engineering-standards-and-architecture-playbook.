# Normalization

## What is it?

Organising tables so each fact is stored exactly once. The normal forms are
a ladder; in practice **third normal form (3NF)** is the target for
transactional schemas.

## Why does it matter?

Duplicated facts drift. If a user's name is on the `users` row and copied
onto every `files` row, a rename leaves stale copies. Normalized data has one
place to update and cannot contradict itself.

## The forms, practically

| Form | Rule | Violation looks like | Fix |
| --- | --- | --- | --- |
| **1NF** | Every column holds one atomic value; no repeating groups | `tags = 'a,b,c'`; `phone1, phone2, phone3` | Child table `file_tags(file_id, tag)` |
| **2NF** | Every non-key column depends on the *whole* key | In `order_items(order_id, product_id, product_name)`, `product_name` depends only on `product_id` | Move `product_name` to `products` |
| **3NF** | No non-key column depends on another non-key column | `files(owner_id, owner_email)`: `owner_email` depends on `owner_id`, not on the file | Drop `owner_email`; join to `users` |
| BCNF and beyond | Edge cases with overlapping candidate keys | Rare in application schemas | Usually already satisfied by 3NF |

## Recommended approach

1. Model each entity once.
2. Reference, don't copy: store the id of the related row.
3. Split repeating groups into child tables.
4. Then, and only then, denormalize specific hot reads with a documented reason ([denormalization.md](denormalization.md)).

## Example

```sql
-- Avoid (violates 1NF and 3NF)
create table orders (
  id uuid primary key,
  customer_email text,
  customer_name text,
  items text            -- '[{"sku":"A","qty":2},...]'
);

-- Recommended (3NF)
create table customers (id uuid primary key, email citext unique not null, name text not null);
create table orders (id uuid primary key, customer_id uuid not null references customers(id), placed_at timestamptz not null default now());
create table order_items (
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),   -- snapshot: prices change; see denormalization.md
  primary key (order_id, product_id)
);
```

Note the deliberate snapshot: `unit_price_cents` is copied because the
*historical* price is a fact about the order, not the product. That is not a
normalization violation; it is a different fact.

## When JSON columns are acceptable

- Data with no fixed schema that is stored and returned whole (webhook payloads, user preferences, audit `detail`).
- Never for data you filter, join, or aggregate on in hot paths. If you find yourself indexing JSON keys, promote them to columns.

## Common mistakes

- Normalizing lookups that never change and are always read with the parent (a two-row `statuses` table with FK ceremony). A `CHECK IN (...)` is enough.
- Denormalizing before measuring.
- Confusing a historical snapshot (order price) with a duplicate (owner email).

## Checklist

- [ ] No comma-separated lists or numbered columns.
- [ ] Every non-key column describes the row's own entity.
- [ ] Copies of other entities' attributes are either snapshots (documented) or removed.

## Related

- [denormalization.md](denormalization.md)
- [postgres/json.md](postgres/json.md)
