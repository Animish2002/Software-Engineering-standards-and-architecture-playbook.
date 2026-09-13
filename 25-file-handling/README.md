# 25 — File handling

Uploading, storing, serving, and processing user files.

The default for this stack: **the browser uploads straight to object storage
using a short-lived presigned URL, the bucket is private, and a database row
owns the metadata.** The application server issues permission and records
facts; it does not move bytes unless there is a reason.

| Document | Topic |
| --- | --- |
| [upload-strategies.md](upload-strategies.md) | Presigned direct upload vs through-server vs multipart; choosing one. |
| [validation-and-security.md](validation-and-security.md) | The threat list: type spoofing, traversal, SVG/XSS, bombs, malware, quotas. |
| [storage-and-keys.md](storage-and-keys.md) | Bucket layout, key design, the `files` table, lifecycle, orphans. |
| [serving-and-access.md](serving-and-access.md) | Private-by-default delivery, signed reads, CDN caching, downloads. |
| [processing-and-transforms.md](processing-and-transforms.md) | Images with `sharp`, derivatives, on-the-fly transforms, video and documents. |
| [frontend-uploads.md](frontend-uploads.md) | React upload UX: progress, abort, retry, previews. |
| [file-handling-checklist.md](file-handling-checklist.md) | The one-page checklist. |

## Principles

1. **The bucket is private.** Public buckets are for a static marketing asset
   you would put in the repo anyway. User content is granted per request and
   time-limited.
2. **Nothing the client says about a file is true.** The filename, the
   extension, and the `Content-Type` are claims. Bytes are evidence.
3. **The database is the source of truth; the bucket holds bytes.** A file
   that has no row does not exist, and is garbage to be collected.
4. **Keys are generated, never user-supplied.** This removes path traversal,
   collisions, and enumeration in one decision.
5. **Limit before you read.** Size, count, rate, and per-owner quota are
   enforced at the moment permission is issued, not after the bytes arrive.
6. **User content is served from an origin that is not the app origin**, so a
   file that turns out to be executable cannot reach the app's cookies.
7. **Processing is a job, not a request** ([02-backend/background-jobs.md](../02-backend/background-jobs.md)).

## Choosing storage

| Option | Use when | Notes |
| --- | --- | --- |
| **Cloudflare R2** (default here) | Anything on this stack | S3-compatible API, no egress fees, native Workers binding. Use the S3 API from Node, the binding from Workers. |
| **AWS S3** | The rest of the infrastructure is AWS | Same code path as R2; watch egress cost when serving directly. |
| **Local disk** | Never in production; single-node dev only | Dies with the container, breaks the moment you scale to two instances, no CDN. Use a local S3-compatible container (MinIO) in dev instead so dev matches production. |
| **Database BLOB column** | Small (< 100 KB), few, and transactional with the row | Bloats backups and the working set. Files as bytes in Postgres is a decision you have to justify, not a default. |

## The shape of every upload

```text
1. Client asks for permission      POST /api/files          { filename, contentType, size }
2. Server validates + reserves     -> files row (status='pending'), generated key
3. Server returns a signed URL     -> { fileId, uploadUrl, expiresIn: 300 }
4. Client PUTs bytes to storage    (no app server involved)
5. Client confirms                 POST /api/files/:id/confirm
6. Server verifies + records       HeadObject -> size/type match -> status='ready'
7. Server enqueues processing      thumbnail.generate, scan.file
```

Steps 2 and 6 are where every control in this section lives. Step 6 is not
optional: without it the database fills with rows for uploads that never
completed, and nothing ever verifies what actually landed in the bucket.

## Related

- [15-security/input-validation.md](../15-security/input-validation.md)
- [09-cloudflare/bindings.md](../09-cloudflare/bindings.md)
- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
