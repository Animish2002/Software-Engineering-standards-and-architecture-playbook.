# API performance (contract-level)

Design choices in the API contract that decide client performance before
any code is optimised.

## Screen-shaped reads

A drive view needs items, breadcrumbs, folder sizes, starred ids, and
preview URLs. Five endpoints = a two-stage waterfall (the second stage
needs ids from the first). One `GET /items/view` returns all of it in one
round trip; the server already knows the ids. Keep the granular endpoints
for other consumers.

## Batch endpoints

`POST /items/preview-urls { ids: [...] }` instead of `GET /items/:id/preview-url`
× N. Cap the array (200) on anything reachable without auth.

## Pagination shape

Cursor for feeds (constant cost); offset only for bounded admin tables;
no `total` unless needed ([05-apis/pagination.md](../05-apis/pagination.md)).

## Payload size

- Explicit fields; no nested blobs the screen doesn't render.
- Ids + separate detail endpoint for large related objects.
- Compression at the edge.
- Preview/thumbnail URLs instead of inline base64.

## Caching headers

- Authenticated: `private, no-store` (correctness over speed; the client cache layer handles reuse).
- Public reads: `public, max-age=60, stale-while-revalidate=300` and `ETag` so revalidation is a 304.
- Immutable assets: long `max-age` + `immutable`.

## Bytes never through the API

Uploads and downloads go browser ↔ object storage with presigned URLs.
The API handles metadata only. This removes the largest class of load
entirely.

## Client-side cache contract

The API's shape enables the frontend cache: stable ids, ISO timestamps,
and `updatedAt` fields let the client mark stale and revalidate without a
skeleton ([10-frontend/api-integration.md](../10-frontend/api-integration.md)).

## Polling vs push

Polling an unread count every 30 s is cheap and enough at small scale.
Move to SSE/WebSockets only when the polling load or the latency
requirement demands it.

## Checklist

- [ ] Each screen loads with ≤ 2 API round trips.
- [ ] Batch endpoints for per-item derived data.
- [ ] Cursor pagination on large lists; page size capped.
- [ ] No file bytes through the API.
- [ ] Correct `Cache-Control` per response class.

## Related

- [backend.md](backend.md)
- [05-apis/rest-api-design.md](../05-apis/rest-api-design.md)
