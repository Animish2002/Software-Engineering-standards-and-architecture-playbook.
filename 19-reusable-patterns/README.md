# 19 — Reusable patterns

Copy-ready code for the pieces every project needs and that should be
written once. Each file is self-contained, typed, and matches the
conventions in the rest of the playbook. Copy the file, rename imports,
done.

| Folder | Contents |
| --- | --- |
| [backend/](backend/README.md) | `http-errors.ts`, `response.ts`, `async-handler.ts`, `pagination.ts`, `env-config.ts`, `request-context.ts`, `require-permission.ts` |
| [frontend/](frontend/README.md) | `http.ts` (API client with refresh), `use-api-query.ts` (cache + revalidate), `confirm-dialog.tsx`, `states.tsx` (loading/error/empty), `apply-server-errors.ts` |
| [database/](database/README.md) | soft-delete helpers, keyset pagination query, audit log table + writer, `updated_at` trigger |
| [api/](api/README.md) | envelope types, standard error codes, Zod primitives shared by API and forms |
| [utilities/](utilities/README.md) | `format.ts` (bytes, dates), `retry.ts`, `ids.ts` (tokens, v7 uuids), `map-concurrency.ts` |

## Rules for this folder

- Nothing here has business logic. If a snippet mentions "user" or "file", it's an example placeholder.
- Each snippet is small enough to read in one screen. If it grows, it's a package, not a pattern.
- When a project improves a pattern, update it here the same week.
