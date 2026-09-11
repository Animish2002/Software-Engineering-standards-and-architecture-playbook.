# The event loop

## What is it?

Node runs JavaScript on **one thread**. I/O (network, disk, database) is
handed to the OS or a thread pool and completes via callbacks/promises. The
event loop takes completed events and runs their JavaScript, one at a time.

```text
timers → pending callbacks → poll (I/O) → check (setImmediate) → close callbacks
                     ↑  microtasks (promises, queueMicrotask) drain between each phase and after each callback
```

## Why does it matter?

If any JavaScript runs for 200 ms, **every** request waits 200 ms. One
synchronous JSON.parse of a 50 MB body, one `bcrypt.hashSync`, one
`for` loop over a million rows, and the whole server stalls. High
throughput comes from never blocking; not from multiple threads.

## What blocks

| Blocking | Non-blocking alternative |
| --- | --- |
| `fs.readFileSync`, `execSync`, `bcrypt.hashSync`, `zlib.gzipSync` | The async versions (`fs/promises`, `bcrypt.hash`, `zlib.gzip`) |
| `JSON.parse`/`stringify` of very large payloads | Streaming parsers, or limit payload size |
| Big synchronous loops (sorting/aggregating 1M objects) | Do it in SQL; batch and `await setImmediate()`; worker thread |
| Regex with catastrophic backtracking on user input | Bounded input length; simpler regex; `re2` |
| Crypto (`pbkdf2Sync`, `scryptSync`) | Async variants (use libuv's thread pool) |
| Template rendering of huge documents | Stream it |

`bcrypt.hash` (async) runs in the thread pool; `hashSync` blocks. This
alone matters at login volume.

## Measuring

- **Event-loop lag**: `perf_hooks.monitorEventLoopDelay()` or a library (`@pm2/io`, `event-loop-lag`). Log p99 lag; alert above ~100 ms.
- Node `--cpu-prof` or `node --inspect` + Chrome DevTools to find the hot synchronous function.
- Request latency that rises *with concurrency* while CPU is high is the signature of loop blocking.

```ts
import { monitorEventLoopDelay } from 'node:perf_hooks';
const h = monitorEventLoopDelay({ resolution: 20 }); h.enable();
setInterval(() => logger.info({ p99Ms: h.percentile(99) / 1e6 }, 'event-loop'), 30_000).unref();
```

## The thread pool

libuv's pool (default 4 threads) handles fs, dns, crypto, zlib. Heavy use
(many concurrent bcrypt hashes) saturates it; raise `UV_THREADPOOL_SIZE`
(up to 128) or move to worker threads. Network I/O does not use the pool.

## Microtasks vs macrotasks

Promise callbacks (microtasks) run before the loop moves on. A chain that
schedules microtasks endlessly starves I/O just like a sync loop. Yield with
`await setImmediate()` (from `node:timers/promises`) inside long async
loops.

## Related

- [async-patterns.md](async-patterns.md)
- [process-management.md](process-management.md) (worker threads)
- [22-javascript/event-loop.md](../22-javascript/event-loop.md)
