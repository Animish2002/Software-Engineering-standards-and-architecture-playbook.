# Memory in Node.js

## Heap limits

V8's default old-space limit depends on the machine; in a container, set it
explicitly to ~75% of the memory limit so Node GCs before the OOM killer
strikes:

```text
NODE_OPTIONS=--max-old-space-size=768     # for a 1 GB container
```

## Signs of a leak

- RSS/heap grows steadily across hours without plateauing; restarts "fix" it.
- `MaxListenersExceededWarning`.
- GC pauses lengthen over time.

## Usual causes

| Cause | Fix |
| --- | --- |
| Unbounded in-memory cache (`Map` that only grows) | TTL + max size (LRU) ([02-backend/caching.md](../02-backend/caching.md)) |
| Event listeners added per request and never removed | Add once at startup; use `once`; remove in cleanup |
| Closures capturing large objects in long-lived structures (timers, global arrays) | Store ids, not objects; clear timers |
| Per-request loggers/clients created and retained | Create once; child loggers are cheap and GC'd |
| Large request bodies buffered | Body limits; streams |
| Promises that never settle (pending forever, holding their closures) | Timeouts on all I/O |
| Module-level arrays used as "queues" | Real queue with bounded size |

## Diagnosing

```bash
node --heapsnapshot-signal=SIGUSR2 dist/server.js     # send SIGUSR2 → writes a .heapsnapshot
node --inspect dist/server.js                          # DevTools > Memory > take snapshots over time, compare
```

Compare two snapshots minutes apart; the retained objects that grow are the
leak. `process.memoryUsage()` logged every minute gives the trend.

## Buffers

`Buffer` memory is outside the V8 heap (`external`/`arrayBuffers` in
`memoryUsage()`). Large buffered uploads show there, not in `heapUsed`.

## Related

- [performance.md](performance.md)
- [streams.md](streams.md)
