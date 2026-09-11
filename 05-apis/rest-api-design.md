# REST API design

## What is it?

A resource-oriented HTTP API: nouns in paths, HTTP methods as verbs, status
codes as outcomes, a consistent JSON shape. Not a religion; a set of
conventions that let any client (and any engineer) predict how an endpoint
behaves before reading its docs.

## Why does it matter?

Consistency is the feature. When every list endpoint paginates the same
way and every error looks the same, the frontend needs one client, one
error handler, one pagination component. When they differ, each endpoint
needs custom handling and bugs hide in the differences.

## Principles

1. **Resources are nouns, plural, in the path.** `/users`, `/users/:id/quota`.
2. **Methods carry the verb.** `GET` reads, `POST` creates or acts, `PATCH` updates partially, `DELETE` removes. [http-methods.md](http-methods.md)
3. **Status codes carry the outcome.** Don't return 200 with `{ success: false }`. [status-codes.md](status-codes.md)
4. **One envelope.** `{ success: true, data }` / `{ success: false, error }`. [response-format.md](response-format.md)
5. **Validate everything at the edge.** [request-validation.md](request-validation.md)
6. **Identity from the token, never from the body.**
7. **Lists are paginated, bounded, and sortable by declared fields only.** [pagination.md](pagination.md)
8. **Non-CRUD actions are sub-resource verbs.** `POST /items/:id/trash`, `POST /items/:id/restore`, `POST /shares/link`.
9. **Composite reads are fine.** `GET /items/view?folderId=` returning items + breadcrumbs + sizes in one call is better than five calls. REST doesn't forbid a screen-shaped read endpoint; just keep the granular ones too.
10. **Public and private routes are mounted so that public ones can't be shadowed** by an auth middleware registered on a router with no prefix.

## Reference endpoint set (file-storage example)

```text
Auth
POST   /auth/login                     → { user, permissionKeys, accessToken }; sets refresh cookie
POST   /auth/refresh                   → new access token (rotates cookie)
POST   /auth/logout                    → revokes refresh token
GET    /auth/me                        → current user + permissionKeys
PATCH  /auth/me                        → edit own name/password
POST   /auth/forgot-password           → always 200
POST   /auth/reset-password            → { token, password }

Items
GET    /items/view?folderId=           → { items, breadcrumbs, folderSizes, starredIds, previewUrls }
GET    /items?folderId=                → items only
GET    /items/breadcrumbs?folderId=
GET    /items/trash
GET    /items/quota
POST   /folders                        → 201
POST   /files                          → 201 { file, uploadUrl }   (presigned PUT; bytes never pass through the API)
GET    /items/:id/download-url         → { url }
PATCH  /items/:id/rename
PATCH  /items/:id/move
POST   /items/:id/trash
POST   /items/:id/restore
POST   /items/preview-urls             → batch: { ids[] } → { [id]: url }   (cap ids at 200)

Users (admin)
GET    /users?page=&pageSize=
GET    /users/directory                → every active user except caller (for pickers)
POST   /users                          → 201
PATCH  /users/:id
PATCH  /users/:id/quota
DELETE /users/:id                      → soft delete
POST   /users/:id/restore

Shares
POST   /shares/link
POST   /shares/person
DELETE /shares/:id
GET    /shares?resourceId=
GET    /shares/shared-with-me
GET    /shares/public/:token           → no auth
GET    /shares/public/:token/items?folderId=
GET    /shares/public/:token/download-url?fileId=

Ops
GET    /health                         → liveness, no auth, no DB
GET    /health/system                  → privileged diagnostics, always 200 with status in body
```

## Bad example

```text
GET  /getUsers
POST /user/create
POST /deleteUser?id=5
GET  /users/5/delete
POST /api/v1/doStuff   { "action": "trash", "id": ... }
```

Verbs in paths, GET with side effects, action dispatch through a body
field. Each requires reading the code to know what it does.

## Alternatives (and when)

| Style | Use when |
| --- | --- |
| **REST + JSON** (default) | Public or multi-client APIs; CRUD-shaped domains; caching by URL matters. |
| RPC-style typed endpoints (tRPC, Hono RPC) | Single TypeScript frontend + backend in one repo, no third-party clients, you want end-to-end types without codegen. Still keep the envelope and status discipline. |
| GraphQL | Many clients with very different data needs, and you can afford the server complexity (resolvers, N+1 tooling, auth per field). Rarely worth it for one product. |
| Server-Sent Events / WebSockets | Real push (chat, live cursors). Polling is enough for counts and notifications at small scale. |

## Checklist

- [ ] Nouns in paths; verbs in methods; sub-resource verbs for actions.
- [ ] Every response uses the envelope; every error has a `code`.
- [ ] Every list is paginated and bounded.
- [ ] Every input is validated; identity comes from the token.
- [ ] Public routes cannot be shadowed by auth middleware.
- [ ] OpenAPI generated from the same schemas ([documentation.md](documentation.md)).

## Related

- [resource-naming.md](resource-naming.md), [http-methods.md](http-methods.md), [status-codes.md](status-codes.md)
- [23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md) ("REST vs other approaches")
