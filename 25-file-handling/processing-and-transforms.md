# Processing and transforms

## What is it?

Everything you do to a file after it lands: thumbnails, format conversion,
metadata stripping, text extraction, transcoding.

## Why does it matter?

Image processing is CPU- and memory-heavy and its cost is driven by the
*input*, which a user chose. Doing it inside the request handler means a
single upload can stall a process, and a crafted one can kill it.

## When should I NOT use it?

If the product shows images at roughly the size they were uploaded and the
uploads are already small (a 200 KB logo), skip derivatives entirely. Serve
the original and move on. Generating four sizes of every avatar for an
internal tool with fifty users is work that pays nothing back.

## Recommended approach

### Process in a job, always

Enqueue on confirm; never in the request
([02-backend/background-jobs.md](../02-backend/background-jobs.md)). The UI
shows the original (or a placeholder) until derivatives exist.

```ts
// jobs/handlers/generate-derivatives.ts
import sharp from 'sharp';

const SIZES = [
  { name: 'thumb', width: 320 },
  { name: 'preview', width: 1280 },
] as const;

export async function generateDerivatives({ fileId }: { fileId: string }) {
  const file = await filesRepo.findById(fileId);
  if (file.status !== 'ready' || !file.mimeType.startsWith('image/')) return;

  const source = await s3.send(new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: file.storageKey }));
  const input = Buffer.from(await source.Body.transformToByteArray());

  for (const size of SIZES) {
    const output = await sharp(input, { limitInputPixels: 50_000_000, sequentialRead: true })
      .rotate()                                   // apply EXIF orientation, then drop the metadata
      .resize({ width: size.width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: `${derivativePrefix(file)}/${size.name}.webp`,     // deterministic: safe to repeat
      Body: output,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  }

  await filesRepo.markDerivativesReady(fileId);
}
```

Four things in that snippet are deliberate:

| Line | Why |
| --- | --- |
| `limitInputPixels` | A 10 KB PNG can declare 50,000 × 50,000 pixels. Without this, decoding it is an OOM. |
| `.rotate()` with no argument | Applies the EXIF orientation tag. Without it, phone photos come out sideways once metadata is stripped. |
| `sharp` drops metadata by default | GPS coordinates in a photo a user uploads are a privacy leak you are responsible for. Do not add `.withMetadata()` unless you have a reason. |
| Deterministic derivative key | The job is idempotent — a retry overwrites the same object rather than creating a second one. |

### Pre-generated vs on-the-fly

| Approach | Use when |
| --- | --- |
| **Pre-generate a fixed set** (default) | You know the sizes the UI needs. Predictable cost, simple serving, no cold-start latency. |
| **On-the-fly at the edge** (Cloudflare Images, imgproxy) | Sizes vary or are not known in advance; you have a large existing library to serve without a backfill |

If you go on-the-fly, the transform parameters must be signed or constrained
to an allowlist. An open resize endpoint is a denial-of-service amplifier:
each unique size is a cache miss and a fresh decode.

### Non-image files

| Type | Recommendation |
| --- | --- |
| **Video** | Do not build this. Transcoding, adaptive bitrate, and player delivery is a product, not a feature. Use Cloudflare Stream, Mux, or equivalent. |
| **PDF** | `pdf-lib` for manipulation; render previews in a sandboxed worker with a hard timeout. PDF parsers are a historically rich source of memory-safety bugs — treat input as hostile. |
| **Office documents** | Convert with LibreOffice headless in an isolated container, or use a service. Never in the API process. |
| **Text extraction / OCR** | A job with a timeout and a size cap, results cached on the row. |
| **Archives** | See the archive limits in [validation-and-security.md](validation-and-security.md). |

## Bad example

```ts
// Avoid: unbounded decode, in the request, metadata preserved, non-deterministic key
app.post('/upload', async (req, res) => {
  const buf = await sharp(req.file.buffer).resize(300).withMetadata().toBuffer();
  await s3.putObject({ Key: `thumbs/${Date.now()}.jpg`, Body: buf });
  res.json({ ok: true });
});
```

An image bomb takes down the API, GPS coordinates survive into a public
thumbnail, and every retry leaves another orphaned object.

## Common mistakes

- Processing inline, so upload latency is a function of image dimensions.
- No `limitInputPixels`, so a decompression bomb is an outage.
- Keeping EXIF, publishing users' home coordinates.
- Non-deterministic derivative keys, so at-least-once delivery leaves duplicates.
- Regenerating derivatives that already exist on every retry — check first, or make the write idempotent (this one is).
- Running transcoding on the API container and wondering why p99 latency is erratic.

## Production considerations

- Run the worker with a memory limit and let it be killed; `sharp` holds native memory outside the V8 heap, so `--max-old-space-size` will not save you.
- Cap concurrency: image jobs are CPU-bound, so a concurrency above the core count only adds context switching.
- Set a job timeout. A pathological input that takes four minutes should fail, not occupy a worker.
- `sharp` ships prebuilt binaries per platform — build the Docker image on the same architecture you deploy, or install with the correct `--platform` ([13-docker/](../13-docker/)).
- Workers cannot run `sharp` (no native modules). On Cloudflare, use Images or a transform binding instead.
- Track job duration and failure rate per type ([../27-observability/metrics.md](../27-observability/metrics.md)).

## Checklist

- [ ] All processing happens in a background job, never in the request.
- [ ] `limitInputPixels` (or equivalent) is set on every decode.
- [ ] EXIF is stripped; orientation is applied first.
- [ ] Derivative keys are deterministic, so retries are idempotent.
- [ ] Derivatives are `immutable` and long-cached.
- [ ] Job timeout and bounded concurrency.
- [ ] Video and Office conversion are delegated, not built.

## Related

- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
- [serving-and-access.md](serving-and-access.md)
- [17-performance/frontend.md](../17-performance/frontend.md)
