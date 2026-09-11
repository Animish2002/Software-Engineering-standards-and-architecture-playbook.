# Naming conventions

## Why does it matter?

Consistent names let a reader predict where something is and what it does
before opening it. Inconsistent names make every lookup a search.

## Files and folders

| Kind | Convention | Example |
| --- | --- | --- |
| Folders | `kebab-case` | `user-profile/`, `api-client/` |
| Non-component JS/TS files | `kebab-case` with a role suffix | `users.service.ts`, `users.routes.ts`, `parse-ids.ts` |
| React components | `PascalCase.tsx`, one exported component per file | `UserTable.tsx`, `ShareDialog.tsx` |
| Hooks | `use-*.ts` or `useX.ts`, exporting `useX` | `use-media-query.ts` → `useMediaQuery` |
| Tests | Same name + `.test.ts` next to the unit, or under `tests/` for integration | `users.service.test.ts` |
| Config files | Tool-defined names | `vite.config.ts`, `drizzle.config.ts`, `wrangler.jsonc` |
| Markdown | `kebab-case.md`; `README.md` per folder | `query-optimization.md` |

Role suffixes used in this playbook: `.routes`, `.controller`, `.service`,
`.repository`, `.schema` (validation), `.types`, `.test`. Pick one set and use
it everywhere in a project.

## Code identifiers

| Kind | Convention | Example |
| --- | --- | --- |
| Variables, functions | `camelCase`; functions start with a verb | `activeUsers`, `fetchUser()`, `isExpired()` |
| Booleans | `is`/`has`/`can`/`should` prefix | `isTrashed`, `hasPermission`, `canEdit` |
| Constants (true constants) | `SCREAMING_SNAKE_CASE` | `MAX_UPLOAD_BYTES`, `ACCESS_TOKEN_TTL` |
| Classes, types, interfaces, enums, components | `PascalCase` | `NotFoundError`, `UserRole`, `UserTable` |
| Type parameters | Single capital or short `PascalCase` | `T`, `TItem` |
| Enum members / union literals | `camelCase` strings for data, `PascalCase` for TS enums | `'active' \| 'trashed'` |
| Event handlers | `handleX` inside, `onX` as props | `handleSubmit`, `onSubmit` |
| Async functions | No `Async` suffix; the return type says it | `loadUsers()` not `loadUsersAsync()` |
| Private module helpers | Plain names, not exported | `function normalize()` |

Don't prefix interfaces with `I` (`IUser`). Don't suffix with `Impl`. Don't
use Hungarian notation.

## Database

| Kind | Convention | Example |
| --- | --- | --- |
| Tables | `snake_case`, plural | `users`, `order_items` |
| Columns | `snake_case`, singular | `created_at`, `owner_id` |
| Primary key | `id` | |
| Foreign key | `<singular_table>_id` | `user_id`, `parent_folder_id` |
| Boolean columns | `is_`/`has_` prefix | `is_trashed` |
| Timestamps | `<event>_at`, `timestamptz` | `created_at`, `trashed_at` |
| Junction tables | Both tables, alphabetical, plural | `role_permissions`, `user_roles` |
| Indexes | `idx_<table>_<columns>` | `idx_files_owner_id_parent_id` |
| Unique indexes | `uq_<table>_<columns>` | `uq_users_email` |
| Constraints | `fk_`, `chk_`, `pk_` prefixes | `chk_files_size_nonnegative` |
| Enum types (PG) | `snake_case` singular | `share_type` |

Full detail in [03-databases/naming-conventions.md](../03-databases/naming-conventions.md).

## API

| Kind | Convention | Example |
| --- | --- | --- |
| Paths | lowercase, plural nouns, kebab-case, no verbs | `/users`, `/audit-logs`, `/users/:id/quota` |
| Query params | `camelCase` | `?folderId=&pageSize=` |
| JSON fields | `camelCase` | `{ "createdAt": ... }` |
| Error codes | `SCREAMING_SNAKE_CASE` | `ACCOUNT_DEACTIVATED`, `VALIDATION_FAILED` |
| Permission keys | `resource:action` | `file:upload`, `user:manage` |
| Headers | Standard names; custom ones `X-Request-Id` | |

Full detail in [05-apis/resource-naming.md](../05-apis/resource-naming.md).

## Environment variables

`SCREAMING_SNAKE_CASE`, grouped by prefix: `DATABASE_URL`, `JWT_SECRET`,
`R2_BUCKET_NAME`, `AUTOSEND_API_KEY`. Frontend build-time variables carry the
bundler prefix (`VITE_API_URL`) and must never hold secrets.

## Git

- Branches: `type/short-description` → `feat/share-dialog`, `fix/logout-ends-session`.
- Commits: Conventional Commits → `feat(shares): enforce edit permission`.
  See [18-devops/git.md](../18-devops/git.md).

## Common mistakes

- Mixing `userId` and `user_id` in the same layer. Convert at the boundary
  (Drizzle column mapping does this: `ownerId: uuid('owner_id')`).
- Generic names: `data`, `info`, `item`, `temp`, `result` for anything that has a real name.
- Verb-less function names: `user()` instead of `getUser()`.
- Component files named by page section (`Section2.tsx`).

## Checklist

- [ ] One file-naming scheme per project, applied everywhere.
- [ ] Booleans read as questions.
- [ ] Database, API, and code each use their own casing, converted at the boundary.
- [ ] No `I`-prefixed interfaces or `Impl` suffixes.
