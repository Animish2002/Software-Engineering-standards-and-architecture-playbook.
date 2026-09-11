# 05 — APIs

How an HTTP API should look from the outside: paths, methods, status codes,
envelopes, errors, pagination, versioning, security, and the operational
concerns around it. Implementation lives in [02-backend/](../02-backend/README.md),
[07-express/](../07-express/README.md), [08-hono/](../08-hono/README.md).

| Document | Answers |
| --- | --- |
| [rest-api-design.md](rest-api-design.md) | The principles and the reference endpoint set. |
| [resource-naming.md](resource-naming.md) | Paths, nouns, nesting, actions that aren't CRUD. |
| [http-methods.md](http-methods.md) | GET/POST/PUT/PATCH/DELETE semantics, safety, idempotency. |
| [status-codes.md](status-codes.md) | Which code for which outcome. |
| [request-validation.md](request-validation.md) | Body/query/params/headers validation contract. |
| [response-format.md](response-format.md) | The `{ success, data }` envelope; dates, ids, nulls. |
| [error-format.md](error-format.md) | The error envelope; codes; field errors. |
| [pagination.md](pagination.md) | Offset and cursor shapes on the wire. |
| [filtering-sorting-searching.md](filtering-sorting-searching.md) | Query parameter conventions. |
| [versioning.md](versioning.md) | When and how to version. |
| [idempotency.md](idempotency.md) | Safe retries for POST. |
| [rate-limiting.md](rate-limiting.md) | Limits, headers, keys. |
| [api-security.md](api-security.md) | Auth transport, CORS, headers, abuse controls. |
| [webhooks.md](webhooks.md) | Sending and receiving webhooks reliably. |
| [documentation.md](documentation.md) | OpenAPI, generated from schemas. |
| [observability.md](observability.md) | Request ids, logs, metrics, tracing. |

Checklist: [21-checklists/api-checklist.md](../21-checklists/api-checklist.md).

## The reference contract in one glance

```text
GET    /users                 list (paginated, filterable)
GET    /users/:id             one
POST   /users                 create → 201 + resource
PATCH  /users/:id             partial update → 200 + resource
DELETE /users/:id             soft delete → 200 + resource (or 204)
POST   /users/:id/restore     non-CRUD action as a sub-resource verb
GET    /users/:id/quota       sub-resource

Response:  { "success": true,  "data": { ... } }
Error:     { "success": false, "error": { "message": "...", "code": "NOT_FOUND", "details": {...} } }
```
