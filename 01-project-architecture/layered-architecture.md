# Layered architecture

## What is it?

Code organised into horizontal layers, each depending only on the one below:

```text
Presentation   routes, controllers, React components
Application    services (use cases, orchestration)
Domain         business rules, entities, validation of invariants
Infrastructure repositories, external clients, email, storage
```

In practice for a JavaScript backend, three layers are enough:
**controller → service → repository**. See [02-backend/layers.md](../02-backend/layers.md).

## Why does it matter?

Each layer changes for a different reason. HTTP details change with the API
contract; rules change with the product; queries change with the schema.
Keeping them apart keeps each change small and testable.

## When should I use it?

Inside every module or feature. Layering is *how a module is organised
internally*, not how the whole app is divided (that is
[feature-based-architecture.md](feature-based-architecture.md)).

## When should I NOT use it (as the top-level structure)?

```text
src/
├── controllers/   40 files
├── services/      40 files
├── repositories/  40 files
└── routes/        40 files
```

This is layering as the *top-level* organisation. It works up to ~10
modules; after that, one feature is spread across four folders and every
change touches all of them. Switch to feature folders with layers inside.

## Recommended approach

Rules per layer:

| Layer | May import | Must not |
| --- | --- | --- |
| Routes | Controllers, middleware | Services directly (keep parsing in controllers) |
| Controllers | Services, schemas, response helpers | Repositories, database, ORM |
| Services | Repositories, other modules' public services, lib | `req`/`res`, HTTP status codes, framework types |
| Repositories | Database client, schema | Business rules, other repositories (compose in the service) |

Skip a layer when it would be a pass-through. A controller may call a
repository *read* directly for a trivial list endpoint if there is truly no
rule; upgrade to a service the moment one appears. Be consistent within a
module.

## Example

```ts
// items.controller.ts
export const listChildren = asyncHandler(async (req, res) => {
  const { folderId } = listChildrenQuerySchema.parse(req.query);
  const items = await itemsService.listChildren(req.user.id, folderId ?? null);
  res.json(ok(items));
});

// items.service.ts
export async function listChildren(actorId: string, folderId: string | null) {
  const access = folderId ? await resolveAccess(actorId, folderId) : { ownerId: actorId };
  if (!access) throw new NotFoundError('Folder', folderId ?? undefined);
  return itemsRepo.listChildren(access.ownerId, folderId);
}

// items.repository.ts
export function listChildren(ownerId: string, parentId: string | null) {
  return db.select().from(files).where(and(eq(files.ownerId, ownerId), parentId ? eq(files.parentId, parentId) : isNull(files.parentId), isNull(files.trashedAt)));
}
```

## Common mistakes

- "Anaemic services": every service method is `return repo.x()`. Then the layer adds nothing; call the repository from the controller until a rule appears.
- Repositories that return HTTP-shaped objects.
- Services that build response DTOs with pagination metadata (that's controller work).
- Layer-jumping "just this once".

## Checklist

- [ ] Each layer imports only downward.
- [ ] No framework types below the controller.
- [ ] Repositories contain no conditionals about *whether* to do something.
- [ ] Layers are consistent within a module.

## Related

- [02-backend/layers.md](../02-backend/layers.md)
- [00-engineering-principles/separation-of-concerns.md](../00-engineering-principles/separation-of-concerns.md)
