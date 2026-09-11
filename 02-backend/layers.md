# Controllers, services, repositories

## What are they?

The three layers inside a backend feature module. Each has one job and one
reason to change.

| Layer | Job | Changes when | Knows about |
| --- | --- | --- | --- |
| Controller | Turn a request into a service call and a service result into a response | API contract changes | HTTP, Zod schemas, services |
| Service | Enforce rules, orchestrate, call repositories and other modules | Product rules change | Repositories, other modules' public surfaces, `lib/` |
| Repository | Read and write the database | Schema or query strategy changes | Drizzle, schema |

## Controller

- Parses and validates input (`schema.parse(req.body)`); the parse error becomes a 400 via the error middleware.
- Pulls identity from the request (`req.user`), never from the body.
- Calls **one** service function (occasionally two for a composite read endpoint).
- Sets the status code and wraps in the envelope.
- Writes the audit log entry (the actor is only known here).
- Does not: contain `if` about business state, build queries, catch errors it can't recover from.

```ts
export const trashItem = asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const kind = await itemsService.getItemKind(req.user.id, id);
  assertPermission(req.user, kind === 'folder' ? 'folder:delete' : 'file:delete');
  const item = await itemsService.trash(req.user.id, id);
  void audit(req, 'item.trashed', { id, kind });
  res.json(ok(item));
});
```

(The permission check is inline here only because the key depends on the
item's type; the usual place is route middleware.)

## Service

- Receives plain values: `(actorId, input)` or `(input, { actor })`.
- Enforces invariants: ownership, quota, uniqueness, state transitions.
- Throws typed errors (`NotFoundError`, `ForbiddenError`, `ConflictError`).
- Composes repositories and other modules' services; owns transactions.
- Fires side effects (email, notifications) as best-effort or via a job.
- Does not: import framework types, return HTTP codes, format responses.

```ts
export async function moveItem(actorId: string, id: string, targetFolderId: string | null) {
  const [access, target] = await Promise.all([
    resolveAccess(actorId, id),
    targetFolderId ? resolveAccess(actorId, targetFolderId) : null,
  ]);
  if (!access?.canEdit) throw new NotFoundError('Item', id);
  if (targetFolderId && (!target?.canEdit || target.ownerId !== access.ownerId)) throw new ForbiddenError('Cannot move across owners');
  if (await itemsRepo.isDescendant(targetFolderId, id)) throw new ConflictError('Cannot move a folder into itself');
  return itemsRepo.setParent(access.ownerId, id, targetFolderId);
}
```

## Repository

- One function per query. Named by what it returns or does: `findByEmail`, `listChildren`, `setParent`, `sumSizeByOwner`.
- Takes primitives and `ownerId`-style scoping arguments; never `req.user`.
- Returns rows or typed projections; never throws domain errors (return `undefined` for not found; the service decides).
- Accepts an optional transaction handle for calls inside a transaction.
- Does not: decide whether an operation is allowed, call other repositories, send email.

```ts
export function findByEmail(email: string, tx: Db = db) {
  return tx.query.users.findFirst({ where: eq(users.email, email) });
}
```

When a repository would be a one-line pass-through with a single caller,
it is acceptable to query from the service. Be consistent per module and
promote to a repository when a second caller or a test needs it. See
[04-drizzle-orm/repository-pattern.md](../04-drizzle-orm/repository-pattern.md).

## Rules that prevent duplicated logic

1. **One service function per use case.** The HTTP route, the queue consumer, and the CLI all call it. Never re-implement a rule in a second entry point.
2. **Authorization resolves once**, at the top of the service, and the resolved scope (owner id, share root) is passed down. Repositories don't re-check.
3. **Cross-module needs go through the other module's service**, which owns that module's rules.
4. **Shared query fragments** (soft-delete filter, ownership scope) are helpers in the repository file or `db/`, not copied.

## Bad example

```ts
// Avoid: service that is really a controller
export async function createUser(req: Request) {
  if (!req.user) return { status: 401 };
  const body = req.body;                          // unvalidated
  const exists = await db.select().from(users).where(eq(users.email, body.email));  // repo work
  if (exists.length) return { status: 409, message: 'exists' };   // HTTP in service
  // ...
}
```

## Checklist

- [ ] Controllers: parse, call, respond. Nothing else.
- [ ] Services: rules and orchestration; throw typed errors; no HTTP.
- [ ] Repositories: queries only; scoped by owner/tenant argument.
- [ ] One service function per use case, shared by every entry point.
- [ ] Authorization resolved once per request, at the service entry.

## Related

- [01-project-architecture/layered-architecture.md](../01-project-architecture/layered-architecture.md)
- [07-express/controllers.md](../07-express/controllers.md), [07-express/services.md](../07-express/services.md), [07-express/repositories.md](../07-express/repositories.md)
