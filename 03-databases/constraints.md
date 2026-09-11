# Constraints

## What is it?

Rules the database enforces on every write, no matter which code path made
it: primary keys, foreign keys, unique, check, not null, defaults.

## Why does it matter?

Application-level checks protect one code path. Constraints protect the
data. Every bug, script, migration, and concurrent request goes through
them. A constraint is the cheapest test you will ever write.

## The constraint toolbox

| Constraint | Enforces | Example |
| --- | --- | --- |
| `PRIMARY KEY` | Identity, non-null, unique | `id uuid primary key` |
| `NOT NULL` | Presence | `name text not null` |
| `DEFAULT` | A sensible value when omitted | `created_at timestamptz not null default now()` |
| `UNIQUE` | No duplicates (per column set) | `email citext not null unique` |
| `FOREIGN KEY` | Referential integrity + delete behaviour | `owner_id uuid references users(id) on delete restrict` |
| `CHECK` | Row-level invariant | `check (size_bytes >= 0)` |
| Partial unique index | Uniqueness among a subset | `create unique index ... where not is_trashed` |
| Exclusion (PG) | No overlapping ranges | `exclude using gist (room_id with =, during with &&)` |
| Enum / CHECK IN | Closed set of values | `status text check (status in ('draft','published'))` |

## Recommended approach

- **`NOT NULL` by default.** Make a column nullable only when "unknown" is a real state with a meaning.
- **Uniqueness in the database**, always. "Check then insert" in code races under concurrency; the constraint doesn't. Catch the unique-violation error (`23505` PG, `1062` MySQL) and map it to 409.
- **FKs on every reference**, with an explicit `on delete`.
- **CHECKs for cheap invariants**: non-negative amounts, length bounds, mutually dependent columns, valid enum values.
- **Defaults for timestamps and flags**, not for business values that should be supplied deliberately.
- **Name every constraint** in migrations so error messages and later drops are unambiguous.

```sql
alter table files
  add constraint chk_files_size_nonnegative check (size_bytes >= 0),
  add constraint chk_files_trashed_consistency
    check ((is_trashed and trashed_at is not null) or (not is_trashed and trashed_at is null));
```

## Uniqueness with soft deletes

A trashed folder should not block re-creating one with the same name:

```sql
create unique index uq_folders_owner_parent_name
  on folders (owner_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'), name)
  where not is_trashed;
```

MySQL has no partial indexes: use a generated column that is the name when
active and `NULL` when trashed (NULLs don't collide in a unique index), and
put the unique index on that.

## Handling violations in the application

```ts
// one place, in the error middleware
if (isPgError(err) && err.code === '23505') return new ConflictError('Already exists');
if (isPgError(err) && err.code === '23503') return new AppError('Referenced record not found', 400, 'INVALID_REFERENCE');
if (isPgError(err) && err.code === '23514') return new ValidationError({ constraint: err.constraint });
```

## Bad example

```ts
// Avoid: race condition; two requests both pass the check
const existing = await findByEmail(email);
if (existing) throw new ConflictError();
await insert({ email });          // no UNIQUE on email
```

Keep the pre-check for a friendlier message if you like, but the constraint
is the enforcement.

## Common mistakes

- Nullable columns everywhere "for flexibility".
- Boolean columns without `NOT NULL DEFAULT false` (three-valued booleans).
- Enum-like columns with no `CHECK`, so `'Actve'` gets stored.
- Foreign keys omitted "for performance". The cost is negligible; the corruption is not.
- Deferring constraint creation to "later".

## Production considerations

- Adding `NOT NULL` or a `CHECK` to a large existing table: add as `NOT VALID` then `VALIDATE CONSTRAINT` (Postgres) to avoid a long lock. See [migrations.md](migrations.md).
- Constraint errors surface as 4xx to clients with a stable code; never as 500.

## Checklist

- [ ] `NOT NULL` everywhere except real optional values.
- [ ] `UNIQUE` for every business uniqueness rule.
- [ ] FK with explicit `on delete` on every reference.
- [ ] `CHECK` for ranges, lengths, enums, dependent columns.
- [ ] Constraint violations mapped to 400/409 in one place.

## Related

- [schema-design.md](schema-design.md)
- [migrations.md](migrations.md)
- [02-backend/error-handling.md](../02-backend/error-handling.md)
