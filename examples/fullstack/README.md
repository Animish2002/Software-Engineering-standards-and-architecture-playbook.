# Example: one feature across every layer

"Share a file with another user" traced from the database row to the
click, so the boundary between each layer in this playbook is visible in
one place rather than read about separately per section.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Database (03-databases, 04-drizzle-orm)                                  │
│  shares table: resource_type/resource_id (polymorphic, no FK by design), │
│  share_type, permission, shared_with_user_id, token, revoked_at          │
│  unique/partial indexes on active shares — see 19-reusable-patterns/     │
│  database/soft-delete.md for the "active rows only" indexing pattern     │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ shares.repository.ts — scoped insert only, no rules
┌───────────────────────────────▼───────────────────────────────────────────┐
│ Service (02-backend/layers.md)                                           │
│  shares.service.ts:                                                       │
│   1. resolveAccess(actorId, resourceId) → must own or have edit access    │
│      (02-backend/authorization.md)                                        │
│   2. look up the email against real users                                 │
│   3. real user → insert share + notification row + in-app-flavoured email │
│      unknown email → insert share (guest) + emailed token link only       │
│   4. never a write grant for public LINK shares — only share_type='user'  │
│      is considered by resolveAccess elsewhere (02-backend/authorization)  │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ shares.controller.ts — parse, call, audit, respond
┌───────────────────────────────▼───────────────────────────────────────────┐
│ API contract (05-apis)                                                    │
│  POST /shares/person → 201 envelope; see examples/api/README.md for the   │
│  full request/response/error table this layer promises                   │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ lib/api/shares.ts — typed function, ApiResult<T>
┌───────────────────────────────▼───────────────────────────────────────────┐
│ Frontend data layer (10-frontend/api-integration.md)                      │
│  shareWithPeople() fires one POST per recipient in parallel               │
│  (mapConcurrentSettled — 19-reusable-patterns/utilities/map-concurrency)   │
│  and reports per-recipient success/failure so the dialog can re-select    │
│  only the ones that failed                                                │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ useShareWithPeople() hook — marks ['shares'] stale on success
┌───────────────────────────────▼───────────────────────────────────────────┐
│ UI (10-frontend/components, 12-shadcn)                                    │
│  ShareDialog composed from FormDialog + Tabs + MultiSelect (loads the     │
│  user directory once, filters client-side) + PermissionSelect +           │
│  FormActions — see 12-shadcn/composition.md's worked example of exactly   │
│  this dialog                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## The one rule that spans every layer

**A public link is never a write grant, whatever permission it carries.**
This single policy touches four layers at once:

- **Database**: `shares.share_type` distinguishes `'link'` from `'user'`.
- **Service**: `resolveAccess` only ever considers `share_type = 'user'`
  when deciding whether a caller can edit something.
- **API**: the public share routes (`/shares/public/:token/*`) never
  accept a body that mutates anything — they're read/download only.
- **Frontend**: the anonymous share page renders no edit affordances at
  all, regardless of the `permission` value stored on the share row —
  because the backend wouldn't honour a write from that page even if the
  UI offered one.

Documenting a policy in one place and consistently enforcing it at every
layer — never trusting a lower layer to catch what an upper layer forgot
— is the pattern worth taking from this example more than any single
line of code in it.

## Related

- [02-backend/authorization.md](../../02-backend/authorization.md)
- [12-shadcn/composition.md](../../12-shadcn/composition.md)
- [examples/api/README.md](../api/README.md)
- [examples/backend/README.md](../backend/README.md)
- [examples/frontend/README.md](../frontend/README.md)
