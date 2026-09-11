# Modular monolith

## What is it?

A monolith whose code is divided into modules with enforced boundaries: each
module owns its tables, exposes a public API (function exports), and does not
reach into another module's internals. Still one process, one database, one
deploy.

## Why does it matter?

It gives most of the organisational benefits of microservices (clear
ownership, independent reasoning, replaceable parts) with none of the
distributed-systems cost. If a module ever must become a service, its
boundary already exists.

## When should I use it?

- The monolith has grown past roughly five features or three contributors.
- Modules are starting to import each other's repositories or tables directly.
- You want to extract a service later but not now.

## When should I NOT use it?

- Tiny apps: the boundaries are bureaucracy at three modules.
- When the boundaries you'd draw keep changing. Wait until the domain settles.

## Recommended approach

### Module layout

```text
src/modules/orders/
├── index.ts               public surface: what other modules may import
├── orders.routes.ts
├── orders.controller.ts
├── orders.service.ts
├── orders.repository.ts
├── orders.schema.ts       Zod schemas (request/response)
├── orders.types.ts
└── orders.service.test.ts
```

`index.ts` exports the router and the service functions other modules are
allowed to call. It does **not** export the repository.

### Boundary rules

1. Module A calls module B only through `modules/b/index.ts`.
2. A module owns its tables. Other modules do not query them; they call the owning service.
3. Cross-module reads that must be joined for performance are allowed in **read-only query modules** (reports), clearly named, never writing.
4. Cross-module writes that must be atomic use a transaction passed in from the caller ([04-drizzle-orm/transactions.md](../04-drizzle-orm/transactions.md)), or an outbox/event when they can be eventually consistent.
5. Shared infrastructure (`lib/`, `middleware/`, `db/`) has no business rules.

Enforce with an ESLint rule (`no-restricted-imports` or
`eslint-plugin-boundaries`) so a violation fails CI rather than a review.

```js
// eslint.config.js (excerpt)
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/modules/*/*', '!**/modules/*/index'],
        message: 'Import modules through their index.ts public surface.',
      }],
    }],
  },
}
```

### Example: a cross-module call

```ts
// modules/shares/shares.service.ts
import { items } from '../items';        // modules/items/index.ts

export async function createLinkShare(actorId: string, resourceId: string) {
  const kind = await items.getItemKind(actorId, resourceId);   // owner check lives in items
  if (!kind) throw new NotFoundError('Item', resourceId);
  return sharesRepo.insert({ resourceId, resourceType: kind, createdBy: actorId, token: newToken() });
}
```

`shares` never touches the `files`/`folders` tables; `items` decides what
the caller may see.

## Bad example

```ts
// Avoid: reaching across the boundary
import { files } from '../../db/schema';
const row = await db.select().from(files).where(eq(files.id, id));   // inside shares.service
```

Now the ownership rule in `items` is bypassed, and changing the `files`
schema breaks `shares`.

## Common mistakes

- Boundaries on paper only. Without lint enforcement they erode in a month.
- A `common` module that every module imports and that imports every module (a cycle).
- Splitting modules by technical role (`validation` module, `email` module) instead of business concept. Infrastructure goes in `lib/`.

## Production considerations

- One deploy, one database: operational simplicity is preserved.
- Module-level metrics (request counts, latency by route prefix) show which module would benefit from extraction, if any ever does.

## Checklist

- [ ] Every module has an `index.ts` public surface.
- [ ] Repositories are not exported from modules.
- [ ] A lint rule blocks deep imports.
- [ ] Cross-module writes use an explicit transaction or an event.
- [ ] No module depends on `lib/` for business rules.

## Related

- [feature-based-architecture.md](feature-based-architecture.md)
- [02-backend/code-organization.md](../02-backend/code-organization.md)
- [dependency-management.md](dependency-management.md)
