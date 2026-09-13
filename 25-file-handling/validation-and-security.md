# File validation and security

## What is it?

Everything that stands between "a user sent us a file" and "we stored and
served it": deciding what is allowed, verifying what actually arrived, and
making sure serving it cannot hurt anyone.

## The threats, and the control for each

| Threat | What it looks like | Control |
| --- | --- | --- |
| **Type spoofing** | `invoice.pdf` that is actually an HTML page, or a `.jpg` with a PHP payload | Allowlist of types; verify magic bytes after upload |
| **Stored XSS** | An uploaded `.svg` or `.html` served from the app origin runs script with the user's cookies | Serve user content from a separate origin; `Content-Disposition: attachment`; never `text/html` inline |
| **Path traversal / key injection** | `filename = "../../config/secrets.json"` | Keys are generated UUIDs; the original name is metadata only |
| **Oversize / storage exhaustion** | A 40 GB upload, or ten thousand small ones | `ContentLength` in the signature, per-owner quota, rate limit on the presign endpoint |
| **Decompression bomb** | A 10 KB PNG that decodes to 50,000 × 50,000 pixels and OOMs the worker | `sharp` pixel limit; archive expansion-ratio cap |
| **Malware** | A genuine executable or macro document distributed through your product | Scan asynchronously; `status='quarantined'` until clear |
| **Enumeration** | Guessing `/files/1`, `/files/2` | Random keys and ids; authorise every read |
| **SSRF via "upload from URL"** | `url = http://169.254.169.254/latest/meta-data/` | Treat it as an outbound request threat: allowlist schemes, resolve and reject private IPs, no redirects |

## Recommended approach

### Allowlist, never denylist

```ts
// features/files/upload-spec.ts
const UPLOAD_SPECS = {
  image: {
    contentTypes: ['image/jpeg', 'image/png', 'image/webp'],   // note: no image/svg+xml
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxBytes: 10 * 1024 * 1024,
  },
  document: {
    contentTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxBytes: 25 * 1024 * 1024,
  },
} as const;

export function assertAllowedUpload(input: { filename: string; contentType: string; size: number; scope: keyof typeof UPLOAD_SPECS }) {
  const spec = UPLOAD_SPECS[input.scope];
  const ext = path.extname(input.filename).toLowerCase();

  if (!spec.contentTypes.includes(input.contentType)) throw new AppError('UNSUPPORTED_TYPE', 'File type is not allowed', 415);
  if (!spec.extensions.includes(ext)) throw new AppError('UNSUPPORTED_TYPE', 'File extension is not allowed', 415);
  if (input.size <= 0 || input.size > spec.maxBytes) throw new AppError('FILE_TOO_LARGE', `Maximum size is ${spec.maxBytes} bytes`, 413);

  // Returned from the allowlist, not passed through: this is the value that gets stored and later served.
  const mimeType = spec.contentTypes.find((t) => t === input.contentType)!;
  return { mimeType, ext };
}
```

A denylist of dangerous extensions is a list you will always be one entry
behind on. Name what you accept.

### Verify the bytes, not the label

Both the extension and `Content-Type` are supplied by the client. After the
upload lands, read the first bytes and check the real type. Do this in the
inspection job, not in the request.

```ts
// jobs/handlers/file-inspect.ts — file-type v22 is ESM-only
import { fileTypeFromBuffer } from 'file-type';

const HEAD_BYTES = 4100;   // enough for every signature file-type knows

export async function inspectFile({ fileId }: { fileId: string }) {
  const file = await filesRepo.findById(fileId);

  const head = await s3.send(new GetObjectCommand({
    Bucket: config.S3_BUCKET, Key: file.storageKey, Range: `bytes=0-${HEAD_BYTES - 1}`,
  }));
  const detected = await fileTypeFromBuffer(await head.Body.transformToByteArray());

  if (!detected || detected.mime !== file.mimeType) {
    await filesRepo.markRejected(fileId, 'CONTENT_TYPE_MISMATCH');
    await s3.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: file.storageKey }));
    logger.warn({ fileId, declared: file.mimeType, detected: detected?.mime }, 'upload.rejected');
    return;
  }

  await filesRepo.markReady(fileId);
}
```

Fetch a range, not the object. There is no reason to pull 25 MB to read
twelve bytes.

Note the limit of this check: magic bytes prove the file *starts* like a PNG.
They do not prove the rest is harmless. It is a cheap, high-value filter, not
a guarantee — which is why serving is hardened independently.

### Keys are generated

```ts
// Recommended
const storageKey = `${ownerId}/${scope}/${fileId}${ext}`;   // fileId is a UUID

// Avoid — every one of these is attacker-controlled
const storageKey = `uploads/${req.body.filename}`;
const storageKey = path.join('uploads', userInput);         // join does not stop '../'
```

Keep the original filename in a column. Use it only when you hand the file
back, and encode it when you do ([serving-and-access.md](serving-and-access.md)).

### SVG is a program

An SVG can contain `<script>`. So can an HTML file, an XML file with an
external entity, and a PDF. The controls, in order of preference:

1. **Do not accept SVG** for user avatars or attachments. `image/svg+xml` is
   absent from the allowlist above on purpose.
2. If the product genuinely needs it (a logo uploader for tenants), sanitise
   server-side with DOMPurify in `svg` mode, store the *sanitised* output, and
   still serve it from the separate content origin.
3. Never serve any user file as `text/html`. Set the stored `Content-Type`
   from your allowlist, not from the client.

### Image bombs

```ts
// Recommended: bound the decode, not just the file size
const image = sharp(input, { limitInputPixels: 50_000_000, sequentialRead: true });
```

`sharp` accepts a small compressed file that decodes to an enormous bitmap
unless you cap pixels. Run image work in the job process, so an OOM kills a
worker rather than the API.

### Archives

If you extract uploaded archives at all: cap the entry count, cap the total
uncompressed size, reject expansion ratios above ~100:1, reject entries whose
resolved path escapes the destination, and reject symlink entries. If the
product does not need extraction, store the archive as an opaque blob.

### Malware scanning

Scan when files are shared between users or leave the system. Skip it for a
single-user private upload in an internal tool — and write down that you
skipped it.

```text
uploaded → status='pending' → confirm → status='scanning'
                                          ├─ clean     → status='ready'
                                          └─ infected  → status='quarantined', alert, never served
```

ClamAV in a container the worker talks to is the usual open-source answer.
Nothing serves a file whose status is not `ready`.

### Quotas and rate limits

```ts
await assertQuotaAvailable(ownerId, size);    // tracked bytes vs the owner's quota
```

Apply a rate limit to the presign endpoint (for example 20/minute/user) and a
per-owner byte quota checked at reservation time. Without a quota, "storage is
cheap" becomes an invoice.

## Bad example

```ts
// Avoid
const BLOCKED = ['.exe', '.sh', '.bat'];
if (BLOCKED.includes(ext)) throw new Error('nope');
await s3.putObject({ Key: filename, Body: buf, ContentType: req.headers['content-type'] });
```

Denylist; client filename as key; client's `Content-Type` persisted and later
echoed back to browsers. `.svg`, `.html`, and `.pdf` all sail through.

## Common mistakes

- Validating only `Content-Type`, which is a header the client typed.
- Storing the client's `Content-Type` and returning it on download — this is how an uploaded file becomes stored XSS.
- Serving user content from the app domain, so any bypass has access to session cookies.
- Checking magic bytes in the request handler for a direct-to-storage upload, where the server never sees the bytes. It belongs in the post-upload job.
- Trusting `path.join` to contain user input. It resolves `..` happily.
- No quota, so one account can fill the bucket.

## Production considerations

- Reject and delete rather than quarantine-forever; keep a `rejected_reason` for support.
- Log `upload.rejected` with the declared and detected types. A spike is an attack or a broken client, and you want to know which.
- Storage credentials are scoped to one bucket with put/get/delete only — no bucket administration ([15-security/secrets.md](../15-security/secrets.md)).
- Re-verify on any path that ingests files from a third party (email attachments, integrations, imports). They get the same pipeline.

## Checklist

- [ ] Allowlist of content types and extensions per upload scope.
- [ ] Size limit enforced in the signature, not only in the UI.
- [ ] Magic-byte verification after upload; mismatch deletes the object.
- [ ] Storage key is generated; the original filename is metadata.
- [ ] SVG excluded, or sanitised and served off-origin.
- [ ] `Content-Type` served from the allowlist, never from client input.
- [ ] User content served from a non-app origin.
- [ ] Pixel/expansion limits on anything decoded.
- [ ] Per-owner quota and a rate limit on the presign endpoint.
- [ ] Only `status='ready'` files are ever served.

## Related

- [15-security/input-validation.md](../15-security/input-validation.md)
- [15-security/xss.md](../15-security/xss.md)
- [serving-and-access.md](serving-and-access.md)
