# Frontend uploads

## What is it?

The browser half of the presigned-upload flow: asking for permission,
sending bytes to storage, reporting progress, and confirming.

## Why does it matter?

Uploads are the slowest thing a user does in your product and the most
likely to fail halfway. An upload UI with no progress and no error recovery
reads as a broken app, even when the backend is perfect.

## Recommended approach

### The hook

Three steps, one state machine. Note the use of `XMLHttpRequest`: `fetch` has
no upload progress event, so for a progress bar it is still the right tool.

```ts
// features/files/use-upload.ts
type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; fileId: string }
  | { status: 'error'; message: string };

export function useUpload(scope: UploadScope) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const abortRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(async (file: File) => {
    const localError = validateLocally(file, scope);        // UX only — the server decides
    if (localError) return setState({ status: 'error', message: localError });

    setState({ status: 'uploading', progress: 0 });
    try {
      const { fileId, uploadUrl } = await api.post('/files', {
        filename: file.name, contentType: file.type, size: file.size, scope,
      });

      await putWithProgress(uploadUrl, file, (progress) => setState({ status: 'uploading', progress }), abortRef);

      await api.post(`/files/${fileId}/confirm`);
      setState({ status: 'done', fileId });
    } catch (error) {
      setState({ status: 'error', message: toMessage(error) });
    }
  }, [scope]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
  }, []);

  return { state, upload, cancel };
}
```

```ts
function putWithProgress(url: string, file: File, onProgress: (n: number) => void, ref: RefObject<XMLHttpRequest | null>) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    ref.current = xhr;
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);        // must match the signed type exactly
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    xhr.send(file);
  });
}
```

The `Content-Type` header must be byte-identical to what the server signed,
or storage rejects the signature. This is the single most common cause of a
mysterious 403 on the PUT.

### Client-side validation is UX, not security

```ts
function validateLocally(file: File, scope: UploadScope) {
  const spec = CLIENT_SPECS[scope];                          // mirrors the server allowlist
  if (file.size > spec.maxBytes) return `Files must be under ${formatBytes(spec.maxBytes)}`;
  if (!spec.contentTypes.includes(file.type)) return 'That file type is not supported';
  return null;
}
```

Its job is to fail in 5 ms instead of after a 40 MB transfer. Every one of
these checks is repeated on the server, which is the one that counts
([validation-and-security.md](validation-and-security.md)).

Set `accept` on the input to match, so the file picker filters by default:

```tsx
<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={...} />
```

### Retry

Retry the PUT, not the whole flow — the presigned URL is still valid for its
window, and re-reserving would leave an orphaned `pending` row.

```ts
for (let attempt = 0; attempt < 3; attempt++) {
  try { return await putWithProgress(url, file, onProgress, ref); }
  catch (error) {
    if (error.name === 'AbortError' || attempt === 2) throw error;
    await sleep(2 ** attempt * 1000);
  }
}
```

Do not retry a 403: that is an expired or mismatched signature, and repeating
it will fail identically. Re-request the upload URL instead.

### Previews

```ts
const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);
```

Object URLs pin the file in memory until revoked. In a gallery of twenty
uploads, forgetting the cleanup is a real leak.

### States to design for

Every one of these happens in normal use, so each needs an actual UI, not a
generic toast ([10-frontend/error-and-loading-states.md](../10-frontend/error-and-loading-states.md)):

| State | What the user should see |
| --- | --- |
| Validating / reserving | Disabled control; no progress bar yet |
| Uploading | Percentage, file name, a cancel button |
| Confirming | Indeterminate — the bytes are sent, the row is being finalised |
| Processing | "Preparing preview"; the file is usable, the thumbnail is not |
| Failed — too large / wrong type | The limit, stated in the message |
| Failed — network | A retry button that reuses the same reservation |
| Cancelled | Back to idle, no half-uploaded row shown in the list |

## Bad example

```tsx
// Avoid
const onChange = async (e) => {
  const form = new FormData();
  form.append('file', e.target.files[0]);
  await fetch('/api/upload', { method: 'POST', body: form });   // no progress, no limit,
  refetch();                                                     // no cancel, no error path
};
```

The user sees a frozen UI for two minutes and no indication of whether it
worked.

## Common mistakes

- Using `fetch` and then wondering why there is no progress event.
- Omitting the `Content-Type` header on the PUT, or sending a different one than was signed.
- Retrying the whole flow on failure, orphaning `pending` rows each time.
- Forgetting `URL.revokeObjectURL`.
- Showing the file in the list before `confirm` returns, so a failed upload leaves a phantom row.
- Blocking the whole form while an avatar uploads in the background.
- Treating "upload complete" as "thumbnail ready" — processing is asynchronous.

## Production considerations

- For multiple files, cap concurrency at 3–4. Twenty parallel uploads saturate the connection and every progress bar crawls.
- Warn on `beforeunload` while an upload is in flight.
- Large files on mobile: the tab can be suspended. This is the point at which multipart with resume earns its complexity.
- Have the API return the file's `status` so the UI can poll or subscribe for `ready` rather than guessing.

## Checklist

- [ ] Three-step flow: reserve → PUT to storage → confirm.
- [ ] Progress via `XMLHttpRequest`; cancel via `abort()`.
- [ ] `Content-Type` on the PUT matches the signed type exactly.
- [ ] Client-side size/type check mirrors the server allowlist, and `accept` is set.
- [ ] Retry the PUT with backoff; re-reserve only on 403.
- [ ] Object URLs revoked.
- [ ] Distinct UI for uploading, confirming, processing, and each failure.
- [ ] Concurrency capped for multi-file uploads.

## Related

- [upload-strategies.md](upload-strategies.md)
- [10-frontend/error-and-loading-states.md](../10-frontend/error-and-loading-states.md)
- [10-frontend/api-integration.md](../10-frontend/api-integration.md)
