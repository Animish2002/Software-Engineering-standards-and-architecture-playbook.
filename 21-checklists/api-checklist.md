# API checklist (per endpoint)

## Shape

- [ ] Path: plural noun, kebab-case, id as segment, action as sub-resource verb (`POST /items/:id/restore`).
- [ ] Method matches semantics; GET has no side effects.
- [ ] Status: 201 create, 200 read/update/action, 204 only for empty, 400 validation, 401/403/404/409/429 as defined.
- [ ] Response uses the envelope; lists are `{ items, ... }` with pagination fields.
- [ ] Field names `camelCase`; timestamps ISO UTC; ids strings; `null` for absent.

## Input

- [ ] Params/query/body validated by Zod; ids validated; sizes bounded.
- [ ] Sort/filter fields whitelisted and indexed.
- [ ] Identity never from the body.
- [ ] `Content-Type: application/json` required for JSON bodies.

## Errors

- [ ] Stable `code` on every error; `details` for validation field errors.
- [ ] No internals in messages.
- [ ] 404 for resources invisible to the caller.

## Auth

- [ ] Explicitly public, or `authenticate` + `requirePermission(key)`.
- [ ] Scope check in the service.
- [ ] Rate limit if public, auth-related, or expensive.

## Reliability

- [ ] Idempotency considered for POSTs with side effects.
- [ ] Bounded arrays; pagination on lists.
- [ ] `Cache-Control` set appropriately (`private, no-store` if authenticated).

## Docs and tests

- [ ] Added to README endpoint list and OpenAPI (if generated).
- [ ] API tests: happy path, validation, 401, 403, 404 tenancy.
- [ ] Audit entry if mutating something privileged.

## Related

- [05-apis/README.md](../05-apis/README.md)
