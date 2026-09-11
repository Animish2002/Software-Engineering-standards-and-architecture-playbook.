# Example: file upload with quota enforcement

Traces one feature through every backend layer, showing the rules from
[02-backend/layers.md](../../02-backend/layers.md) and
[02-backend/authorization.md](../../02-backend/authorization.md) applied
together rather than in isolation.

## The flow

```text
POST /files  { name, mimeType, sizeBytes, parentId }
  → items.routes.ts       requirePermission('file:upload')
  → items.controller.ts   parse body, call service, audit, respond 201
  → items.service.ts      resolve access, lock owner row, check quota, insert, presign upload URL
  → items.repository.ts   scoped insert, scoped quota-sum query
  → error middleware      maps ConflictError('QUOTA_EXCEEDED') to 409 if it's thrown
```

## `items.routes.ts`

```ts
itemsRouter.post('/files', requirePermission('file:upload'), zValidator, c.createFile);
```

## `items.controller.ts`

```ts
export async function createFile(req: Request, res: Response) {
  const input = createFileSchema.parse(req.body);          // 02-backend/validation.md
  const result = await itemsService.createUploadUrl(req.user!.id, input);
  audit(req, 'file.upload_started', { id: result.file.id, sizeBytes: input.sizeBytes });
  res.status(201).json(ok(result));                          // 05-apis/response-format.md
}
```

## `items.service.ts` — the interesting part

```ts
export async function createUploadUrl(actorId: string, input: CreateFileInput) {
  return db.transaction(async (tx) => {                                    // 03-databases/transactions.md
    const scope = input.parentId
      ? await resolveAccess(actorId, input.parentId, tx)                    // 02-backend/authorization.md — scope resolved once
      : { ownerId: actorId, canEdit: true };
    if (!scope?.canEdit) throw new NotFoundError('Folder', input.parentId ?? undefined);   // invisible → 404, not 403

    const owner = await usersRepo.lockForUpdate(scope.ownerId, tx);          // 03-databases/locking.md — FOR UPDATE
    const used = await itemsRepo.sumActiveBytes(owner.id, tx);
    if (owner.storageQuotaBytes !== null && used + input.sizeBytes > owner.storageQuotaBytes) {
      throw new ConflictError('Storage quota exceeded', 'QUOTA_EXCEEDED', { usedBytes: used, quotaBytes: owner.storageQuotaBytes });
    }

    const file = await itemsRepo.insertFile({ ...input, ownerId: owner.id, storageKey: newStorageKey(owner.id) }, tx);
    const uploadUrl = await storage.getUploadUrl(file.storageKey, input.mimeType);   // presign: local HMAC work, safe inside the tx
    return { file, uploadUrl };
  });
}
```

Why the transaction: without `FOR UPDATE`, two concurrent uploads from
the same user could both read "used = 900MB, quota = 1GB," both pass the
check for an 80MB file, and both insert — exceeding the quota. The lock
serialises the read-then-write. See
[03-databases/transactions.md](../../03-databases/transactions.md#recommended-approach).

## `items.repository.ts`

```ts
export function insertFile(values: NewFile, client: DbOrTx = db) {
  return client.insert(files).values(values).returning(fileCols);           // 04-drizzle-orm/repository-pattern.md
}
export async function sumActiveBytes(ownerId: string, client: DbOrTx = db) {
  const [row] = await client.select({ total: sum(files.sizeBytes).mapWith(Number) })
    .from(files).where(and(eq(files.ownerId, ownerId), eq(files.isTrashed, false)));
  return row?.total ?? 0;                                                    // never throws — the service decides what "0" means
}
```

## What this example demonstrates together

- Scope resolved **once**, at the top of the service, then passed down — not re-checked in the repository.
- A row lock protects a read-then-write invariant under concurrency.
- The repository has no business logic — it doesn't know what "quota" means, only how to sum bytes.
- The error carries a stable `code` (`QUOTA_EXCEEDED`) and structured `details` the frontend can render without parsing a message string.
- Presigning happens inside the transaction because it's local computation, not a network call — see the note in [03-databases/transactions.md](../../03-databases/transactions.md#recommended-approach) about keeping transactions free of I/O; an actual network call (e.g., calling a third-party API) would need to happen after commit instead.

## Related

- [02-backend/layers.md](../../02-backend/layers.md)
- [03-databases/locking.md](../../03-databases/locking.md)
- [19-reusable-patterns/backend/http-errors.md](../../19-reusable-patterns/backend/http-errors.md)
