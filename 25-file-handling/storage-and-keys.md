# Storage layout, keys, and metadata

## What is it?

How objects are named in the bucket, what the database records about them,
and how the two are kept from drifting apart.

## Why does it matter?

The key is the one part of a file you can never change cheaply — renaming an
object means copying it. A key that embeds mutable facts (the user's name, a
folder title, the display filename) has to be rewritten every time those
facts change, and every cached URL breaks when it is. A key that embeds
nothing mutable never moves.

## Recommended approach

### Key design

```text
{ownerId}/{scope}/{fileId}{ext}

f3c1…/avatar/9b2e4c7a-….webp
f3c1…/attachment/1d80af52-….pdf
f3c1…/attachment/1d80af52-…/thumb-320.webp     ← derivative under the original's prefix
```

| Rule | Reason |
| --- | --- |
| Generated UUID, not the filename | Removes traversal, collisions, and enumeration |
| Owner (or tenant) prefix first | Lets you list, migrate, price, and bulk-delete per owner; supports prefix-scoped credentials |
| Scope segment | `avatar` and `attachment` get different lifecycle rules and different limits |
| Extension kept | Makes the bucket browsable and lets the CDN infer nothing it shouldn't, but the served type still comes from the database |
| No PII, no sequential ids, no dates you will want to change | The key is immutable; anything mutable belongs in a column |
| Derivatives under the original's prefix | One delete prefix removes the file and everything generated from it |

Content-addressed keys (`sha256/{hash}`) are the alternative. They deduplicate
identical uploads for free, but deleting is no longer safe without reference
counting, and per-owner prefixes disappear. Use them when storing the same
file many times is the norm (a shared asset library), not by default.

### The table

The base `files` table is in
[04-drizzle-orm/schema.md](../04-drizzle-orm/schema.md). Uploading adds a
lifecycle to it:

```ts
export const fileStatus = pgEnum('file_status', [
  'pending',       // reserved, bytes not confirmed
  'scanning',      // confirmed, inspection/scan in flight
  'ready',         // the only status that may be served
  'quarantined',   // scan found something; keep the row, never serve
  'rejected',      // failed verification; object deleted
]);

export const files = pgTable('files', {
  id: id(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  parentId: uuid('parent_id').references(() => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                                  // display name, user-editable
  mimeType: text('mime_type').notNull(),                         // from the allowlist, never from the client
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storageKey: text('storage_key').notNull().unique(),
  checksum: text('checksum'),                                    // ETag or sha256, set on confirm
  status: fileStatus('status').notNull().default('pending'),
  rejectedReason: text('rejected_reason'),
  ...softDelete,
  ...timestamps,
}, (t) => [
  index('idx_files_owner_created').on(t.ownerId, t.createdAt.desc()).where(sql`${t.isTrashed} = false`),
  index('idx_files_pending_created').on(t.createdAt).where(sql`${t.status} = 'pending'`),  // the reaper's index
  check('chk_files_size_nonnegative', sql`${t.sizeBytes} >= 0`),
]);
```

`name` and `storageKey` are deliberately separate: the user renames `name` as
often as they like and the object never moves.

### The two failure modes, and what fixes them

| Drift | Cause | Fix |
| --- | --- | --- |
| **Row without object** | Upload reserved, user closed the tab | Reaper deletes `pending` rows older than 24 h |
| **Object without row** | Delete succeeded in the database, failed in storage; or an upload that was never confirmed | Reconciliation lists the bucket and deletes objects with no `ready`/`quarantined` row, ignoring anything created in the last 24 h |

```ts
// jobs/handlers/reap-pending-uploads.ts — runs hourly
const stale = await db.select().from(files)
  .where(and(eq(files.status, 'pending'), lt(files.createdAt, hoursAgo(24))))
  .limit(500);

for (const file of stale) {
  await s3.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: file.storageKey }))
    .catch(() => {});                              // already absent is the expected case
  await filesRepo.markRejected(file.id, 'UPLOAD_ABANDONED');
}
```

Never delete an object because it is missing a row *right now* — an upload in
flight looks exactly like an orphan. The age window is the whole safety
mechanism.

### Deleting

Delete the row first, the object second, and let the reconciler catch the
gap. The opposite order can leave a row pointing at nothing, which users see
as a broken file; this order can leave a billed object, which a job cleans up.

Soft delete (`isTrashed`) keeps the object. Purge on the hard delete, and
purge derivatives by prefix:

```ts
await s3.send(new DeleteObjectsCommand({
  Bucket: config.S3_BUCKET,
  Delete: { Objects: keys.map((Key) => ({ Key })) },     // up to 1000 per call
}));
```

### Buckets and environments

One bucket per environment, never shared. A staging job that deletes by
prefix must not be able to reach production bytes — and no amount of care in
the code substitutes for the credential simply not having access.

| Setting | Recommendation |
| --- | --- |
| Public access | Blocked. Always. |
| Versioning | On for documents users can overwrite; off for derivative-only buckets |
| Lifecycle: abort incomplete multipart | 7 days |
| Lifecycle: expire a `tmp/` prefix | 1 day, for exports and one-off transforms |
| Cross-environment access | None. Separate credentials per environment ([18-devops/environments.md](../18-devops/environments.md)) |

### Backups

Object storage durability is not a backup — it protects against disk failure,
not against your own delete loop. If losing user files would end the product,
enable versioning or replicate to a second bucket, and confirm you can
actually restore one file by key.

## Bad example

```ts
// Avoid
const key = `${user.email}/${Date.now()}-${file.originalname}`;
```

PII in the key, a collision every time two files arrive in the same
millisecond, an attacker-controlled path, and a rename means a copy.

## Common mistakes

- Putting the display filename in the key, then discovering rename is an O(size) operation.
- No `pending` state, so a failed upload is indistinguishable from a successful one.
- Reaping orphans with no age window, deleting uploads that were still in flight.
- Deleting the object but leaving the row (or the reverse) with nothing to reconcile them.
- Sharing one bucket across dev, staging, and production "to keep it simple".
- Storing `sizeBytes` from the client's claim rather than from `HeadObject`.

## Production considerations

- Track total bytes per owner in a column updated on transition to `ready` and on purge, rather than `SUM()` over the table on every upload.
- Emit `storage.bytes_total` and `files.pending_count` as metrics ([../27-observability/metrics.md](../27-observability/metrics.md)); a climbing pending count means confirms are failing.
- Storage credentials: one bucket, `Get/Put/Delete/List` only, rotated like any other secret.
- Keep the reaper's batch bounded (500 here) so a backlog cannot run for an hour.

## Checklist

- [ ] Keys are `{owner}/{scope}/{uuid}{ext}` and immutable.
- [ ] Display name and storage key are separate columns.
- [ ] `status` column with `pending` → `ready`; only `ready` is served.
- [ ] `sizeBytes` and `checksum` come from `HeadObject`, not the client.
- [ ] Partial index supporting the pending-upload reaper.
- [ ] Hourly reaper with an age window; periodic bucket reconciliation.
- [ ] One bucket per environment, public access blocked.
- [ ] Lifecycle rules for incomplete multipart uploads and temporary prefixes.

## Related

- [04-drizzle-orm/schema.md](../04-drizzle-orm/schema.md)
- [upload-strategies.md](upload-strategies.md)
- [serving-and-access.md](serving-and-access.md)
