# HTTP methods

| Method | Meaning | Safe (no side effects) | Idempotent (repeat = same result) | Body | Success code |
| --- | --- | --- | --- | --- | --- |
| `GET` | Read | Yes | Yes | No | 200 |
| `HEAD` | Read headers only | Yes | Yes | No | 200 |
| `POST` | Create, or perform an action | No | **No** (unless you add an idempotency key) | Yes | 201 (created) / 200 (action) / 202 (accepted, async) |
| `PUT` | Replace the whole resource | No | Yes | Yes | 200 / 204 |
| `PATCH` | Partial update | No | Usually yes if fields are absolute values (`name: "x"`), not if relative (`+1`) | Yes | 200 |
| `DELETE` | Remove (or soft-delete) | No | Yes | Usually no | 200 (with resource) / 204 |
| `OPTIONS` | CORS preflight | Yes | Yes | No | 204 |

## Rules

- **GET never mutates.** Not "mark as read", not "increment views". Browsers prefetch, proxies cache, crawlers follow.
- **POST for creation returns 201 with the created resource** (including its id) and optionally a `Location` header.
- **PATCH over PUT** for updates. Clients rarely hold the whole resource; PUT with a partial body silently nulls fields.
- **DELETE is idempotent**: deleting an already-deleted resource returns 200/204 (or 404 if you prefer strictness; pick one and document it). Never 500.
- **Actions use POST** on a sub-resource (`POST /items/:id/restore`). Return the updated resource.
- **Bulk operations use POST** on a collection verb (`POST /items/preview-urls { ids }`, `POST /users/bulk-import`) with a bounded array.
- **Long-running work returns 202** with a job id and a `GET /jobs/:id` to poll, rather than holding the connection.

## Idempotency of POST

Network retries duplicate POSTs. For anything where duplication matters
(payments, order creation, sending a message), accept an
`Idempotency-Key` header. See [idempotency.md](idempotency.md).

## Method override and tunnelling

Don't accept `?_method=DELETE` or `X-HTTP-Method-Override` in a new API.
Every client you target supports real methods.

## Related

- [status-codes.md](status-codes.md)
- [idempotency.md](idempotency.md)
