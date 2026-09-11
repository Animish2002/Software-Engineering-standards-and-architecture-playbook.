# Streams and buffers

## When to use streams

Any data larger than you'd comfortably hold in memory per request, or that
arrives over time: file uploads/downloads through the server, CSV exports,
log processing, proxying. Below a few MB, `await readFile` / a single buffer
is simpler and fine.

For file storage products, the best stream is **no stream through the
API**: presigned URLs let the browser talk to object storage directly.

## `pipeline`, not `.pipe`

```ts
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';

await pipeline(createReadStream(src), createGzip(), createWriteStream(dest));
```

`pipeline` propagates errors and destroys all streams on failure; `.pipe()`
leaks on error.

## Streaming an HTTP response (CSV export)

```ts
export const exportOrders = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  const rows = ordersRepo.streamByUser(req.user.id);        // async iterable / pg cursor
  await pipeline(rows, toCsvTransform(), res);
});
```

Backpressure is automatic: the database cursor pauses when the client
reads slowly.

## Web Streams

`fetch` bodies and Workers use Web Streams (`ReadableStream`). Node has
both; convert with `Readable.fromWeb()` / `Readable.toWeb()`. New code that
must run on both Node and Workers should prefer Web Streams.

## Buffers

- `Buffer` is Node's `Uint8Array` subclass for binary data.
- Encode/decode explicitly: `Buffer.from(str, 'utf8')`, `buf.toString('base64url')`.
- Don't concatenate chunks in a loop with `+=` on strings for binary data; collect `Buffer`s and `Buffer.concat` once, or better, stream.
- Cap total buffered size when collecting a body manually; the JSON parser's `limit` does this for you.

## Common mistakes

- Reading a whole upload into memory to compute a hash; hash the stream.
- Forgetting to consume or destroy a response body (`fetch`) → connection held.
- Ignoring `drain` on writable streams when writing manually (use `pipeline`).
- Streaming JSON as one giant array without a streaming serializer (build NDJSON instead).

## Related

- [event-loop.md](event-loop.md)
- [performance.md](performance.md)
