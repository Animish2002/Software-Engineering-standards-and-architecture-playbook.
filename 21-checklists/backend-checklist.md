# Backend checklist (per feature / PR)

## Structure

- [ ] Code lives in `modules/<feature>/` with `routes`, `controller`, `service`, `repository`, `schema`, `index.ts`.
- [ ] Controllers only parse, call, respond; services hold rules; repositories only query.
- [ ] Cross-module calls go through the other module's `index.ts`.
- [ ] No business logic in `lib/` or `middleware/`.

## Contract

- [ ] Routes mounted with a prefix; public routes before auth; unprefixed routers last.
- [ ] Every input parsed by a Zod schema (body, query, params); shared with the form if applicable.
- [ ] Responses use `ok()`; errors thrown as `AppError` subclasses; no per-handler status mapping.
- [ ] Lists paginated and bounded; sort fields whitelisted.
- [ ] Status codes correct (201 create, 404 invisible, 409 conflict).

## Auth

- [ ] `authenticate` + `requirePermission(key)` on every non-public route.
- [ ] Resource scope resolved in the service; repositories scoped by owner.
- [ ] Identity from the token only.
- [ ] Tier/self-protection rules where admins act on users.
- [ ] Audit entry for mutations (fire-and-forget).

## Data

- [ ] Migration generated, read, committed; backwards compatible.
- [ ] New FKs indexed; hot queries indexed; `EXPECTED_INDEXES` updated.
- [ ] Transactions for multi-table invariants; read-then-write locked or constrained.
- [ ] Soft-delete filters applied via the shared helper.
- [ ] Unique constraints for business uniqueness; violations mapped to 409.

## Robustness

- [ ] Side effects (email, notifications) best-effort or queued; never fail the request.
- [ ] Outbound calls have timeouts.
- [ ] No sync blocking calls.
- [ ] Sensitive fields never serialised.

## Tests

- [ ] Unit tests for rules with branching.
- [ ] API tests: happy path, validation, 401, 403, 404 (other tenant).
- [ ] Integration test for any new query with filters/joins.

## Docs

- [ ] README endpoints/permissions/schema updated; CHANGELOG entry; CLAUDE.md scope if the architecture changed.

## Related

- [02-backend/README.md](../02-backend/README.md)
