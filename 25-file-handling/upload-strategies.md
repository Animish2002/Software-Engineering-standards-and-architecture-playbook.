# Upload strategies

## What is it?

How bytes get from the user's browser into object storage: through your
server, or directly to storage with a credential your server issues.

## Why does it matter?

Routing uploads through the API server spends your most expensive resource
(request-handling capacity, memory, and bandwidth) on work that storage does
better. A 200 MB upload occupies a Node process for the whole transfer, is
capped by the platform's request body limit and request timeout, and fails
entirely on a dropped connection.

## Choosing

| Strategy | Use when | Cost |
| --- | --- | --- |
| **Presigned direct upload** (default) | Anything user-facing | One extra round trip. The server never sees the bytes, so anything it must inspect happens after the fact, in a job. |
| **Through the server** | You must reject the file synchronously on its *content* (paid virus scan gate, a parser that decides whether the upload is valid at all), or the storage has no presigning | Server memory and time; needs a streaming parser and hard limits. |
| **Multipart / resumable** | Files over ~100 MB, or mobile clients on unreliable networks | Real complexity: part bookkeeping, completion, abort cleanup. Do not build it before a user actually uploads something that large. |
| **Worker binding put** | The upload endpoint runs on Cloudflare Workers | `env.BUCKET.put()` streams the request body with no presigning step. Still enforce size and type. See [09-cloudflare/bindings.md](../09-cloudflare/bindings.md). |

Start with presigned direct upload. Add multipart when a real file exceeds
what a single PUT survives, not in anticipation.

## Recommended approach

### 1. The client asks for permission

The server validates the *claim* (filename, declared type, declared size)
against an allowlist and a quota, generates the key, writes a `pending` row,
and signs a URL scoped to exactly that key, type, and size.

```ts
// storage/client.ts — one S3 client for R2 and S3 alike
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: config.S3_REGION,            // R2: 'auto'
  endpoint: config.S3_ENDPOINT,        // R2: https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY_ID,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY,
  },
});
```

```ts
// storage/presign.ts
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function presignUpload(storageKey: string, mimeType: string, sizeBytes: number) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: storageKey,
      ContentType: mimeType,
      ContentLength: sizeBytes,     // pins the size: a larger body is rejected by storage
    }),
    { expiresIn: 300 },             // 5 minutes is enough to start an upload
  );
}
```

`ContentType` and `ContentLength` in the signed command are the point. Without
them the signature authorises "write anything to this key" and your size limit
is a suggestion the client can ignore.

```ts
// features/files/files.service.ts
export async function createUpload(input: CreateUploadInput, actor: Actor) {
  const spec = assertAllowedUpload(input);            // validation-and-security.md
  await assertQuotaAvailable(actor.userId, input.size);

  const fileId = crypto.randomUUID();
  const storageKey = buildKey({ ownerId: actor.userId, scope: input.scope, fileId, ext: spec.ext });

  await db.insert(files).values({
    id: fileId,
    ownerId: actor.userId,
    storageKey,
    name: input.filename,             // display name, never used as a path
    mimeType: spec.mimeType,          // from the allowlist, not from the client header
    sizeBytes: input.size,            // the claim; replaced by the real size on confirm
    status: 'pending',
  });

  return { fileId, uploadUrl: await presignUpload(storageKey, spec.mimeType, input.size), expiresIn: 300 };
}
```

### 2. The client uploads

A plain `PUT` to the signed URL with the same `Content-Type`. See
[frontend-uploads.md](frontend-uploads.md) for progress and retry.

### 3. The client confirms, and the server verifies

```ts
export async function confirmUpload(fileId: string, actor: Actor) {
  const file = await filesRepo.findForActor(fileId, actor);       // 404 if not theirs
  if (file.status !== 'pending') return file;                     // idempotent

  const head = await s3.send(new HeadObjectCommand({ Bucket: config.S3_BUCKET, Key: file.storageKey }));

  if (head.ContentLength !== file.sizeBytes) {
    throw new AppError('UPLOAD_MISMATCH', 'Uploaded file does not match the reserved upload', 400);
  }

  const updated = await filesRepo.markScanning(fileId, { sizeBytes: head.ContentLength, checksum: head.ETag });
  await jobs.enqueue('file.inspect', { fileId });                 // magic bytes, scan, derivatives
  return updated;
}
```

Confirmation is what turns a reservation into a file. It is also the only
place that knows the upload finished, so it is where processing is enqueued.

## Multipart, when you need it

```ts
// 1. start
const { UploadId } = await s3.send(new CreateMultipartUploadCommand({ Bucket, Key, ContentType }));
// 2. sign each part (client uploads them in parallel, collecting ETags)
const url = await getSignedUrl(s3, new UploadPartCommand({ Bucket, Key, UploadId, PartNumber }), { expiresIn: 900 });
// 3. finish
await s3.send(new CompleteMultipartUploadCommand({
  Bucket, Key, UploadId,
  MultipartUpload: { Parts: parts.map(p => ({ PartNumber: p.number, ETag: p.etag })) },
}));
```

Parts are 5 MB minimum (except the last). Add a bucket lifecycle rule that
aborts incomplete multipart uploads after 7 days — otherwise abandoned parts
are billed forever and are invisible in the object listing.

## Bad example

```ts
// Avoid: the server is now a file transfer proxy with no limits
app.post('/api/files', upload.single('file'), async (req, res) => {
  const name = req.file.originalname;                    // attacker-controlled path
  await s3.putObject({ Key: `uploads/${name}`, Body: req.file.buffer });
  res.json({ ok: true });
});
```

Four defects: the whole file is buffered in memory, there is no size or type
check, the client's filename becomes the storage key, and nothing records
that the file exists.

## Common mistakes

- Signing a URL without `ContentType`/`ContentLength`, then believing the limit you documented.
- Long expiry on upload URLs. Five minutes to *start* the upload is plenty; the transfer itself may exceed it.
- Signing before authorising. The permission check belongs above the signature, not after the upload.
- No confirm step, so `pending` rows accumulate and no one notices uploads that silently failed.
- Trusting the confirm call's body (`{ size: 12 }`) instead of asking storage with `HeadObject`.
- Treating a failed upload as a failed request. The row exists; reap it ([storage-and-keys.md](storage-and-keys.md)).

## Production considerations

- CORS on the bucket must allow `PUT` from the app origin and expose `ETag` for multipart.
- Rate-limit the presign endpoint per user, not just per IP — it is the cheap call that authorises an expensive one.
- Keep the JSON body limit at 1 MB on the API ([02-backend/production-readiness.md](../02-backend/production-readiness.md)); uploads do not need it raised.
- If you must proxy through the server, stream (`busboy`) with a byte counter that destroys the stream at the limit. Never `multer` into memory for anything user-sized.

## Checklist

- [ ] Uploads go browser → storage; the API issues a signed URL only.
- [ ] The signature pins bucket, key, content type, and content length.
- [ ] Authorisation and quota are checked before signing.
- [ ] Expiry is minutes, not hours.
- [ ] A confirm step verifies with `HeadObject` and flips `pending` → `ready`.
- [ ] Bucket CORS allows the app origin and nothing else.
- [ ] Lifecycle rule aborts incomplete multipart uploads.

## Related

- [validation-and-security.md](validation-and-security.md)
- [storage-and-keys.md](storage-and-keys.md)
- [frontend-uploads.md](frontend-uploads.md)
