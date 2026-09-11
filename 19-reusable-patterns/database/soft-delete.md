# Soft delete

```sql
-- columns (Postgres)
alter table files add column is_trashed boolean not null default false, add column trashed_at timestamptz;
alter table files add constraint chk_files_trashed_consistency
  check ((is_trashed and trashed_at is not null) or (not is_trashed and trashed_at is null));

-- hot index on active rows; trash view index on trashed rows
create index idx_files_owner_parent_created on files (owner_id, parent_id, created_at desc) where not is_trashed;
create index idx_files_owner_trashed_at on files (owner_id, trashed_at desc) where is_trashed;

-- uniqueness only among active rows
create unique index uq_folders_owner_parent_name
  on folders (owner_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name)
  where not is_trashed;
```

```ts
// Drizzle: the single active filter per table
export const activeFile = () => eq(files.isTrashed, false);
export const activeFolder = () => eq(folders.isTrashed, false);

// repository functions
export function trashFile(ownerId: string, id: string, client: DbOrTx = db) {
  return client.update(files).set({ isTrashed: true, trashedAt: new Date() })
    .where(and(eq(files.id, id), eq(files.ownerId, ownerId), activeFile())).returning(fileCols);
}
export function restoreFile(ownerId: string, id: string, client: DbOrTx = db) {
  return client.update(files).set({ isTrashed: false, trashedAt: null })
    .where(and(eq(files.id, id), eq(files.ownerId, ownerId), eq(files.isTrashed, true))).returning(fileCols);
}

// service: trash a folder and all descendants atomically
export async function trashFolder(ownerId: string, id: string) {
  return db.transaction(async (tx) => {
    const ids = await foldersRepo.descendantIds(ownerId, id, tx);       // recursive CTE with depth guard, includes id
    const now = new Date();
    await tx.update(folders).set({ isTrashed: true, trashedAt: now }).where(and(inArray(folders.id, ids), eq(folders.ownerId, ownerId), activeFolder()));
    await tx.update(files).set({ isTrashed: true, trashedAt: now }).where(and(inArray(files.parentId, ids), eq(files.ownerId, ownerId), activeFile()));
    const [folder] = await tx.select(folderCols).from(folders).where(eq(folders.id, id));
    return folder;
  });
}
```

MySQL: no partial indexes; add a generated column `active_name = if(is_trashed, null, name)` and put the unique index on `(owner_id, parent_id, active_name)`.

Related: [03-databases/soft-deletes-and-audit-columns.md](../../03-databases/soft-deletes-and-audit-columns.md)
