# Authorization (backend)

## What is it?

Deciding whether the authenticated caller may perform this action on this
resource. Two independent questions:

1. **Capability**: does the caller's role grant `file:upload`? (RBAC)
2. **Ownership/scope**: is *this* file theirs, or shared with them with edit rights?

Both must pass. Capability is checked in route middleware; scope is resolved
at the top of the service.

## Recommended approach

### Data-driven RBAC with permission keys

```text
users ─< user_roles >─ roles ─< role_permissions >─ permissions(key)
```

- Permissions are `resource:action` strings: `file:upload`, `user:manage`, `audit:view`.
- Roles are explicit lists of keys, seeded and *reconciled* (a key removed from a role in code is removed in the database on the next seed).
- The user's resolved keys are embedded in the access token at login/refresh, so `requirePermission` is an array check with no DB round trip.
- **Never** check role names in code (`if (user.role === 'admin')`). Check keys. Roles are data; keys are the contract.

```ts
// middleware/require-permission.ts
export const requirePermission = (key: string) => (req, _res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!req.user.permissionKeys.includes(key)) return next(new ForbiddenError());
  next();
};

// routes
router.post('/users', requirePermission('user:manage'), controller.create);
```

### Resource scope: resolve once, pass down

```ts
// access.service.ts — the single place that answers "what may actor do with resource"
export async function resolveAccess(actorId: string, resourceId: string) {
  // one query: find item, walk up ancestors, look for an active user-share to actor
  // returns { ownerId, canView, canEdit, canDelete, shareRootId } | null
}
```

- Services call `resolveAccess` first and pass the resolved `ownerId` into repositories. Repositories stay owner-scoped and don't re-implement sharing.
- Not-found and forbidden collapse to **404** for resources the caller can't see (don't reveal existence); use 403 only when the caller can see it but lacks the capability.
- Rules that are policy, not incident, get a comment: "a move may never change ownership", "public links are never write grants", "trash/restore stay owner-only".

### Tiered management

When admins manage users, gate *by target tier*, not just by the actor's
key: an `Admin` with `user:manage` can manage Employees; touching an Admin
needs `admin:manage`. Check in the service, where the target is known.

## Bad example

```ts
// Avoid
if (req.user.role === 'Admin' || req.user.role === 'Super Admin') { ... }   // role names in code
const file = await db.query.files.findFirst({ where: eq(files.id, id) });   // no owner scope
await db.update(files).set(req.body).where(eq(files.id, req.body.id));      // id from body
```

## Common mistakes

- Trusting `userId`/`ownerId` from the body. Take it from `req.user`.
- Checking capability but not scope (any authenticated user can read any id).
- Re-checking scope in every repository call instead of resolving once.
- Returning 403 for a resource the caller shouldn't know exists.
- Permission checks in the frontend only. The frontend hides buttons; the backend enforces.

## Production considerations

- Permission change latency = access token TTL. Document it.
- Audit every privileged action with actor id and name (denormalised, so renames don't rewrite history).
- Tests: for every mutating endpoint, a test that user B cannot touch user A's resource, and one that a role without the key gets 403.

## Checklist

- [ ] Permission keys, not role names, everywhere.
- [ ] `requirePermission` on every non-public route.
- [ ] One `resolveAccess`; services resolve once and pass scope down.
- [ ] Identity never from the body.
- [ ] 404 for invisible resources.
- [ ] Tenancy tests for every mutating endpoint.

## Related

- [15-security/authorization.md](../15-security/authorization.md)
- [03-databases/relationships.md](../03-databases/relationships.md) (junction tables for RBAC)
- [16-testing/api-testing.md](../16-testing/api-testing.md)
