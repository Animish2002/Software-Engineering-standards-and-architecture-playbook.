# Serving files and controlling access

## What is it?

Getting a stored file back to an authorised user, without making the bucket
public and without turning your API into a bandwidth bill.

## Why does it matter?

This is where the two expensive mistakes live. Making the bucket public
exposes every file to anyone who can guess or leak a URL, permanently, with
no audit trail. Streaming every download through the API makes every file
view occupy a request handler for the duration of the transfer, and puts your
egress on the critical path of the application.

## Choosing a delivery method

| Method | Use when | Trade-off |
| --- | --- | --- |
| **Presigned GET** (default) | Private user content: attachments, documents, avatars in an authenticated app | The URL works for anyone holding it until it expires. Keep expiry short and never log it. |
| **App proxy / stream** | You must audit or meter every read, apply per-read authorisation too complex to encode in a signature, or transform on the way out | Server bandwidth and a held connection per download |
| **CDN with signed URLs or tokens** | Public-ish but access-controlled content at scale (course video, large images) | Setup cost; revocation is harder because edges cache |
| **Genuinely public bucket/prefix** | Marketing assets, logos, files that would be in the repo if they were not user-editable | Nothing private may ever land in that prefix. Enforce it with a separate bucket, not a convention. |

## Recommended approach

### Authorise, then sign

```ts
// features/files/files.service.ts
export async function getDownloadUrl(fileId: string, actor: Actor) {
  const file = await filesRepo.findById(fileId);

  if (!file || file.isTrashed) throw new AppError('NOT_FOUND', 'File not found', 404);
  await assertCanRead(actor, file);                 // 404, not 403, if it should be invisible
  if (file.status !== 'ready') throw new AppError('FILE_NOT_READY', 'File is not available yet', 409);

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: file.storageKey,
      ResponseContentType: file.mimeType,                        // from our allowlist
      ResponseContentDisposition: contentDisposition(file.name), // see below
    }),
    { expiresIn: 300 },
  );
}
```

The signature is the *result* of an authorisation decision, so the decision
has to come first. `ResponseContentType` overrides whatever type the object
carries, which is the second half of the stored-XSS defence from
[validation-and-security.md](validation-and-security.md).

### Content-Disposition, and non-ASCII filenames

```ts
// Recommended: RFC 5987 encoding, with an ASCII fallback for old clients
function contentDisposition(name: string, mode: 'attachment' | 'inline' = 'attachment') {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
```

Default to `attachment`. Use `inline` only for types you are confident the
browser renders harmlessly — images, PDFs — and never for anything
HTML-adjacent. Escaping the quote and backslash matters: a filename
containing `"` otherwise breaks out of the header value.

### Serve from a different origin

User content goes on `files.example.com` (or the R2 custom domain), not
`app.example.com`. If a file ever executes in the browser, the origin
boundary means it has no access to the app's cookies or local storage. This
costs one DNS record and is the single highest-value control on this page.

Add a restrictive header set on that origin:

```text
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; sandbox
Cross-Origin-Resource-Policy: same-site
```

`nosniff` stops the browser second-guessing your `Content-Type`; the sandbox
CSP neutralises anything that does manage to be HTML.

### Caching

| Case | `Cache-Control` |
| --- | --- |
| Derivative at an immutable key (`thumb-320.webp`) behind a CDN | `public, max-age=31536000, immutable` |
| Private file via presigned URL | `private, max-age=0, no-store` |
| Anything an authenticated API returns | `private, no-store` ([02-backend/production-readiness.md](../02-backend/production-readiness.md)) |

Because keys are immutable ([storage-and-keys.md](storage-and-keys.md)),
long cache lifetimes are safe: a changed file is a new key, not new bytes at
the same key.

Do not let a shared cache store a presigned URL's response under a key that
other users can hit. If the CDN sits in front of private content, the
signature must be part of the cache key, or the content must not be cached
at all.

### Streaming through the app, when you must

```ts
// Only when every read must be audited or metered
const object = await s3.send(new GetObjectCommand({
  Bucket: config.S3_BUCKET, Key: file.storageKey,
  Range: req.headers.range,                       // pass through for seekable media
}));

res.status(req.headers.range ? 206 : 200);
res.set({
  'Content-Type': file.mimeType,
  'Content-Length': String(object.ContentLength),
  'Content-Disposition': contentDisposition(file.name),
  'Accept-Ranges': 'bytes',
  'X-Content-Type-Options': 'nosniff',
  ...(object.ContentRange && { 'Content-Range': object.ContentRange }),
});
Readable.fromWeb(object.Body.transformToWebStream()).pipe(res);
```

Stream it; never `await response.arrayBuffer()` and send. Buffering a 200 MB
file puts 200 MB in the heap per concurrent download.

## Bad example

```ts
// Avoid
app.get('/files/:key', async (req, res) => {
  const obj = await s3.send(new GetObjectCommand({ Bucket, Key: req.params.key }));
  res.type(obj.ContentType).send(await obj.Body.transformToByteArray());
});
```

No authorisation, the key comes from the URL so any object in the bucket is
readable, the stored `Content-Type` is trusted, the whole file is buffered,
and it is served from the app origin.

## Common mistakes

- Making the bucket public "for now". It is never revisited, and by then the URLs are in emails and third-party caches.
- Long-lived signed URLs (days) pasted into notifications — a forwarded email becomes permanent access.
- Logging the signed URL. The signature is a credential; redact it like a token.
- Returning 403 for a file the user should not know exists. Use 404 ([15-security/authorization.md](../15-security/authorization.md)).
- Serving user content from the app origin.
- Trusting the object's stored `Content-Type` instead of overriding it from the database.
- Caching private responses in a shared CDN without the signature in the cache key.

## Production considerations

- Presigned GET expiry: 5 minutes for a download the user just clicked; up to an hour for a document viewer that re-fetches. Refresh from the API rather than lengthening expiry.
- Serve derivatives, not originals, to list views. A gallery that loads full-size images is a bandwidth bill and a slow page ([17-performance/frontend.md](../17-performance/frontend.md)).
- R2 has no egress fee, which makes direct-from-storage delivery notably cheaper than S3 for read-heavy products.
- Metric worth having: download count and bytes served per owner. It is how you discover both abuse and your most expensive customer.

## Checklist

- [ ] Bucket is private; no public read.
- [ ] Authorisation happens before the URL is signed.
- [ ] Only `status='ready'` files are served.
- [ ] `Content-Type` is overridden from the database allowlist.
- [ ] `Content-Disposition: attachment` by default, with RFC 5987 encoding.
- [ ] User content is on a separate origin with `nosniff` and a sandbox CSP.
- [ ] Signed URL expiry is minutes; URLs are never logged.
- [ ] Immutable derivatives are cached long; private responses are `no-store`.
- [ ] Any app-proxied download streams rather than buffers.

## Related

- [validation-and-security.md](validation-and-security.md)
- [15-security/http-headers.md](../15-security/http-headers.md)
- [09-cloudflare/caching.md](../09-cloudflare/caching.md)
