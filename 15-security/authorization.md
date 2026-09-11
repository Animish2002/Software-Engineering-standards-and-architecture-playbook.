# Authorization

Implementation: [02-backend/authorization.md](../02-backend/authorization.md).

## Model: data-driven RBAC with permission keys

- `permissions.key` = `resource:action` (`file:upload`, `user:manage`, `audit:view`).
- `roles` = explicit lists of keys, seeded from code and **reconciled** (removed keys are revoked on redeploy).
- `user_roles` junction; a user's resolved keys are embedded in the access token at login/refresh.
- Code checks **keys**, never role names. Roles are data.

## Two checks on every request

1. **Capability**: `requirePermission('x:y')` in route middleware. No DB round trip (keys are in the token).
2. **Scope**: the service resolves what the caller may do with *this* resource (`resolveAccess(actorId, resourceId)`), once, and passes the resolved owner/scope to repositories.

Both must pass. Missing either is the most common authorization bug:
a permission check without scope lets any user with `file:download`
download any file by id.

## Rules

| Rule | Reason |
| --- | --- |
| Identity from the token only; never from body/query | Otherwise anyone can act as anyone |
| 404 for resources the caller can't see | Don't confirm existence |
| 403 only when the caller can see the resource but lacks the capability | |
| Tiered admin: managing an Admin needs `admin:manage`, not just `user:manage` | Prevent lateral privilege escalation among admins |
| Public share links are never write grants | No identity to attribute writes to; tokens travel by email |
| Ownership never changes via move/edit | A recipient with edit could otherwise take ownership |
| Trash/restore stay owner-only unless a distinct permission level exists | Easy to widen, hard to walk back |
| Self-protection: a user can't deactivate or demote themselves | Prevents lockout and accidental loss of the last admin |
| Bootstrapping the first super-admin happens out of band (a script) | Nobody can grant it via the UI before one exists |

## Permission change latency

Keys in the token mean a change applies at the next refresh (≤ access
TTL). Document it. If instant revocation is required, keep a per-user
`tokenVersion` checked on refresh, or check a revocation list on
sensitive routes only.

## Testing (non-negotiable)

For every mutating endpoint:

- A user without the key gets 403.
- A user with the key but no scope (other tenant's id) gets 404.
- An unauthenticated request gets 401.
- Public share tokens can't reach outside the shared subtree.

Run them as an API test suite (`test:api:security`).

## Audit

Every privileged action writes an audit row: actor id, denormalised actor
name, action, target, detail, timestamp. `ON DELETE SET NULL` on the
actor FK so history survives purges.

## Related

- [authentication.md](authentication.md)
- [16-testing/api-testing.md](../16-testing/api-testing.md)
