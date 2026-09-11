# `updated_at` trigger (Postgres)

Drizzle's `$onUpdate` only runs for ORM updates. A trigger covers raw SQL,
scripts, and other clients.

```sql
-- custom migration
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- one per table with an updated_at column
create trigger trg_users_updated_at   before update on users   for each row execute function set_updated_at();
create trigger trg_folders_updated_at before update on folders for each row execute function set_updated_at();
create trigger trg_files_updated_at   before update on files   for each row execute function set_updated_at();
```

Generate the migration with `drizzle-kit generate --custom --name=updated_at_triggers`
and paste the SQL in.

MySQL: `updated_at datetime(6) not null default current_timestamp(6) on update current_timestamp(6)` does it without a trigger.

Related: [03-databases/soft-deletes-and-audit-columns.md](../../03-databases/soft-deletes-and-audit-columns.md)
