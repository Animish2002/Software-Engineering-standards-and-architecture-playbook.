# Express services

Services don't know Express exists. Rules in
[02-backend/layers.md](../02-backend/layers.md).

```ts
// modules/items/items.service.ts
import { db } from '@app/db';
import { NotFoundError, ForbiddenError, ConflictError } from '../../lib/errors.js';
import * as itemsRepo from './items.repository.js';
import { resolveAccess } from '../access/index.js';
import { storage } from '../../lib/storage.js';

export async function createFolder(actorId: string, input: { name: string; parentId: string | null }) {
  const scope = input.parentId ? await resolveAccess(actorId, input.parentId) : { ownerId: actorId, canEdit: true };
  if (!scope?.canEdit) throw new NotFoundError('Folder', input.parentId ?? undefined);
  const existing = await itemsRepo.findFolderByName(scope.ownerId, input.parentId, input.name);
  if (existing) throw new ConflictError('A folder with that name already exists here');
  return itemsRepo.insertFolder({ ownerId: scope.ownerId, parentId: input.parentId, name: input.name });
}

export async function createUploadUrl(actorId: string, input: CreateFileInput) {
  return db.transaction(async (tx) => {
    const scope = input.parentId ? await resolveAccess(actorId, input.parentId, tx) : { ownerId: actorId, canEdit: true };
    if (!scope?.canEdit) throw new NotFoundError('Folder', input.parentId ?? undefined);
    const owner = await usersRepo.lockForUpdate(scope.ownerId, tx);
    const used = await itemsRepo.sumActiveBytes(owner.id, tx);
    if (owner.storageQuotaBytes !== null && used + input.sizeBytes > owner.storageQuotaBytes) throw new ConflictError('Storage quota exceeded');
    const file = await itemsRepo.insertFile({ ...input, ownerId: owner.id, storageKey: newStorageKey(owner.id) }, tx);
    const uploadUrl = await storage.getUploadUrl(file.storageKey, input.mimeType);   // presign is local HMAC work; fine inside
    return { file, uploadUrl };
  });
}
```

## Conventions

- Signature: `(actorId, input, options?)`. The actor is an id (plus permission keys when tier rules need them), never `req.user` as a whole if you can avoid it, so the service is callable from jobs with a synthetic actor.
- Resolve access once at the top; pass `ownerId` down.
- Throw typed errors; return plain data.
- Transactions live here; repositories take `tx`.
- Side effects that can fail independently (email, notification) are fire-and-forget with a logged catch, or a job.
- Export only what other modules need through `index.ts`.

## Testing

Unit-test rules with the repository replaced (`vi.mock` the repository
module) *or* integration-test against a test database. Rules with tricky
branching (ownership, tiers, quota) deserve unit tests; the rest is
covered by API tests. See [16-testing/unit-testing.md](../16-testing/unit-testing.md).

## Related

- [repositories.md](repositories.md)
- [02-backend/authorization.md](../02-backend/authorization.md)
