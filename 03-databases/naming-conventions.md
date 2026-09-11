# Database naming conventions

Consistent names make the schema self-documenting and let tooling (Drizzle
introspection, migrations, log searches) work predictably.

| Object | Convention | Example |
| --- | --- | --- |
| Table | `snake_case`, plural noun | `users`, `audit_logs`, `password_reset_tokens` |
| Junction table | The two tables it joins, plural, alphabetical when there's no natural order | `role_permissions`, `user_roles` |
| Column | `snake_case`, singular | `owner_id`, `created_at`, `storage_quota_bytes` |
| Primary key | `id` | |
| Foreign key | `<referenced_singular>_id`; role-qualified when the same table is referenced twice | `user_id`; `created_by`, `shared_with_user_id` |
| Boolean | `is_` / `has_` / `can_` prefix | `is_trashed`, `has_verified_email` |
| Timestamp | `<event>_at`, type `timestamptz` (PG) / `datetime(6)` in UTC (MySQL) | `created_at`, `revoked_at` |
| Date (no time) | `<event>_on` or `<noun>_date` | `billed_on`, `birth_date` |
| Counts / amounts | Include the unit | `size_bytes`, `price_cents`, `duration_ms` |
| Enum values | lowercase `snake_case` strings | `'view'`, `'edit'`, `'pending_review'` |
| Enum type (PG) | singular `snake_case` | `share_type` |
| Index | `idx_<table>_<col1>_<col2>` | `idx_files_owner_id_parent_id` |
| Unique index/constraint | `uq_<table>_<cols>` | `uq_users_email` |
| Foreign key constraint | `fk_<table>_<col>` | `fk_files_owner_id` |
| Check constraint | `chk_<table>_<rule>` | `chk_files_size_nonnegative` |
| Primary key constraint | `pk_<table>` (usually implicit) | |
| Sequence (if explicit) | `<table>_<col>_seq` | `orders_number_seq` |
| View | `v_<purpose>` or plain plural noun | `v_active_files` |
| Materialised view | `mv_<purpose>` | `mv_folder_sizes` |
| Function/trigger | `<verb>_<noun>` / `trg_<table>_<event>` | `set_updated_at`, `trg_files_updated_at` |
| Migration file | `NNNN_<snake_description>.sql` | `0008_index_hot_columns.sql` |

## Reserved words and case

- Never quote identifiers to allow mixed case or spaces; lowercase everything.
- Avoid names that need quoting in either database: `user`, `order`, `group`, `key`, `value`, `type`, `name` is fine as a column but not as a table.
- Prefix ambiguous columns with the entity in joins-heavy tables only when it reduces confusion (`file_name` on a table that also stores `folder_name`); otherwise plain.

## Cross-layer casing

Database `snake_case` ↔ code `camelCase`. Convert exactly once, at the ORM
column mapping (`ownerId: uuid('owner_id')`). Never leak `owner_id` into
the API or `ownerId` into SQL.

## Related

- [00-engineering-principles/naming-conventions.md](../00-engineering-principles/naming-conventions.md)
- [04-drizzle-orm/schema.md](../04-drizzle-orm/schema.md)
