# Code organization decisions

## Utility function vs service

```text
Is it a pure transformation with no knowledge of the domain's rules
(formatting, parsing, math, string manipulation)? ───────► Utility function, in lib/
                                                             (formatBytes, parsePagination, encodeCursor)

Does it enforce a business rule, orchestrate other calls,
or need access to the database/other modules? ────────────► Service function, in the owning module
                                                             (createFolder, resolveAccess, trashUser)
```

The test: could this function be copied into a completely different
product unchanged? If yes, it's a utility. If it embeds a rule specific
to *this* product ("a file can't exceed the owner's quota"), it's a
service. See [00-engineering-principles/avoiding-code-redundancy.md](../00-engineering-principles/avoiding-code-redundancy.md).

## Service vs repository

```text
Does it decide WHETHER something should happen
(a rule, a permission check, an orchestration)? ───────────► Service
Does it only decide HOW to read or write a row
(a query shape, filtered/scoped, no branching on business state)? ─► Repository
```

```ts
// Service: decides — "is this allowed, and what else must happen"
export async function trashFile(actorId: string, id: string) {
  const access = await resolveAccess(actorId, id);
  if (!access?.canDelete) throw new ForbiddenError();
  const file = await filesRepo.trash(access.ownerId, id);
  void logAction({ action: 'file.trashed', actorUserId: actorId, resourceId: id });
  return file;
}

// Repository: just the query — no decisions
export function trash(ownerId: string, id: string, client: DbOrTx = db) {
  return client.update(files).set({ isTrashed: true, trashedAt: new Date() })
    .where(and(eq(files.id, id), eq(files.ownerId, ownerId), eq(files.isTrashed, false)))
    .returning(fileCols);
}
```

A repository function that starts containing `if` statements about
business state (not just query shape) is leaking service logic — move
the decision up. Full detail: [02-backend/layers.md](../02-backend/layers.md),
[04-drizzle-orm/repository-pattern.md](../04-drizzle-orm/repository-pattern.md).

## When to introduce an abstraction

```text
Do you have 3+ real, working callers of this exact logic?
  │
  ├── No ──────────────────────────────────────────────► Don't extract yet — duplication you can see
  │                                                        beats indirection you can't follow
  │
  └── Yes
       Would a rule change in one caller need the
       same change in all the others (same reason to change)?
       │
       ├── No — they just look similar today ────────────► Still don't extract — leave the "duplication,"
       │                                                     it's actually three different pieces of knowledge
       │
       └── Yes ─────────────────────────────────────────► Extract. Name it after the domain concept,
                                                             not its shape (`StorageQuotaCheck`, not `Helper2`)
```

Full detail with worked examples of bad/good/over-engineered
abstractions: [00-engineering-principles/abstraction-guidelines.md](../00-engineering-principles/abstraction-guidelines.md).

## Where does a new file go?

```text
Used by one feature only? ───────────────────────────────► Inside that feature's folder
Used by 3+ features, has business meaning? ───────────────► Promote to the module/feature that owns that concept;
                                                              others import through its public surface (index.ts)
Used by 3+ features, NO business meaning
  (a debounce hook, a date formatter)? ────────────────────► components/common, hooks/, or lib/
A UI primitive (button, dialog)? ──────────────────────────► components/ui (shadcn)
```

Full detail: [01-project-architecture/feature-based-architecture.md](../01-project-architecture/feature-based-architecture.md).

## Related

- [../00-engineering-principles/abstraction-guidelines.md](../00-engineering-principles/abstraction-guidelines.md)
- [../02-backend/layers.md](../02-backend/layers.md)
