# Resource naming

## Rules

| Rule | Do | Don't |
| --- | --- | --- |
| Plural nouns | `/users`, `/files` | `/user`, `/getUsers` |
| Lowercase, kebab-case for multi-word | `/audit-logs`, `/password-resets` | `/auditLogs`, `/audit_logs` |
| Ids as path segments | `/users/:id` | `/users?id=` for a single resource |
| Nest only for ownership that matters in the URL | `/users/:id/quota`, `/folders/:id/children` | `/users/:id/folders/:fid/files/:fileId` (three levels; use `/files/:id`) |
| Actions as sub-resource verbs (POST) | `POST /items/:id/trash`, `POST /auth/login` | `POST /items/trash?id=`, `GET /items/:id/trash` |
| Collections of a type under a resource | `/shares?resourceId=` (filter) | `/items/:id/shares` unless shares are only meaningful under items |
| Composite/screen reads named for what they return | `/items/view`, `/dashboard/summary` | `/getEverythingForPage` |
| Public variants under an explicit segment | `/shares/public/:token` | Mixing public and authed under the same path with different auth rules |
| No file extensions or format in the path | `/reports/:id` + `Accept` or `?format=csv` | `/reports/:id.csv` (acceptable if downloads need a filename; then be consistent) |
| No trailing slashes | `/users` | `/users/` |
| Query params `camelCase` | `?folderId=&pageSize=` | `?folder_id=` |

## Ids

- Opaque strings (UUID). Clients never construct or parse them.
- Validate the format in the route schema so a malformed id is a 400, not a database error.

## Sub-resources vs filters

- **Sub-resource** when the child can't exist without the parent and is always accessed through it: `/users/:id/quota`.
- **Filter** when the child is a first-class resource with its own id and other access paths: `/shares?resourceId=x`, `/files?folderId=x`.

## Actions

Prefer a state-changing verb as a sub-resource over overloading PATCH with
a `status` field when the transition has rules (side effects, permissions,
audit):

```text
POST /users/:id/restore          (rules: must be trashed; needs admin:manage for admin-tier)
PATCH /users/:id  { isTrashed: false }   (avoid: looks like a plain field edit)
```

Use PATCH for plain field edits (`name`, `quota`).

## Naming permission keys alongside

`resource:action` mirrors the endpoints: `file:upload` ↔ `POST /files`,
`user:manage` ↔ `/users/*`, `audit:view` ↔ `GET /audit-logs`. Keeping them
parallel makes the route table self-explanatory.

## Related

- [rest-api-design.md](rest-api-design.md)
- [00-engineering-principles/naming-conventions.md](../00-engineering-principles/naming-conventions.md)
