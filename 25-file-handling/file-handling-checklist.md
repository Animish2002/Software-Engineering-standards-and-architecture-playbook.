# File handling checklist

Run this when adding an upload feature, and before any product that accepts
files goes to production.

## Storage setup

- [ ] One bucket per environment; public access blocked on all of them.
- [ ] Credentials scoped to a single bucket, `Get/Put/Delete/List` only.
- [ ] CORS allows `PUT` from the app origin only, and exposes `ETag`.
- [ ] Lifecycle rule aborts incomplete multipart uploads (7 days).
- [ ] User content served from a non-app origin (`files.example.com`).

## Upload path

- [ ] Browser uploads directly to storage; the API only signs.
- [ ] Authorisation and quota checked before signing.
- [ ] Signature pins bucket, key, `ContentType`, and `ContentLength`.
- [ ] Upload URL expires in minutes.
- [ ] Presign endpoint is rate-limited per user.
- [ ] Confirm step verifies with `HeadObject` and is idempotent.

## Validation

- [ ] Allowlist of content types and extensions per upload scope.
- [ ] Size limit per scope, enforced in the signature.
- [ ] Magic-byte check after upload; mismatch rejects and deletes.
- [ ] SVG excluded, or sanitised and served off-origin.
- [ ] Pixel limit on every image decode; expansion limits on any archive.
- [ ] Per-owner byte quota.

## Data

- [ ] Storage key is `{owner}/{scope}/{uuid}{ext}`, generated and immutable.
- [ ] Display name is a separate, editable column.
- [ ] `status` column; only `ready` is ever served.
- [ ] `sizeBytes` and `checksum` come from storage, not from the client.
- [ ] Reaper for stale `pending` rows, with an age window.
- [ ] Reconciliation job for objects with no row.

## Serving

- [ ] Every read is authorised before a URL is signed.
- [ ] `Content-Type` overridden from the database allowlist.
- [ ] `Content-Disposition: attachment` by default, RFC 5987 encoded.
- [ ] `X-Content-Type-Options: nosniff` and a sandbox CSP on the content origin.
- [ ] Signed URLs are never logged.
- [ ] Immutable derivatives cached long; private responses `no-store`.

## Processing

- [ ] All processing in background jobs, with timeouts and bounded concurrency.
- [ ] EXIF stripped, orientation applied.
- [ ] Derivative keys deterministic, so retries are idempotent.
- [ ] Malware scanning if files are shared between users — or a written decision not to.

## Frontend

- [ ] Progress, cancel, and retry.
- [ ] `Content-Type` on the PUT matches the signed type.
- [ ] Client-side validation mirrors the server allowlist.
- [ ] Distinct UI for uploading, confirming, processing, and each failure.
- [ ] Object URLs revoked.

## Operations

- [ ] Metrics: upload success rate, pending count, bytes stored per owner, job failures.
- [ ] Alert on rejected-upload spikes and on dead-lettered processing jobs.
- [ ] Backup or versioning decision made and recorded.

## Related

- [README.md](README.md)
- [21-checklists/security-checklist.md](../21-checklists/security-checklist.md)
