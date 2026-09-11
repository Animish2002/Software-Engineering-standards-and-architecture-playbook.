# Process management

## One process per instance

Run one Node process per container/instance and scale horizontally with
the platform (more instances behind a load balancer). The platform handles
restarts, logs, and health. This is simpler and more robust than managing
processes yourself.

| Tool | Use when |
| --- | --- |
| Platform (Railway, Fly, Render, K8s Deployment) | Default |
| `pm2` | A single VM you manage by hand; provides restarts, clustering, log rotation. Prefer a platform. |
| `cluster` module | A single large VM where you must use all cores and can't run multiple containers. Rare. |
| `systemd` unit | Bare-metal/VM deployments without a platform |

## Worker threads

For CPU-bound work (image resizing, PDF rendering, heavy parsing) that
would block the event loop:

```ts
import { Worker } from 'node:worker_threads';
// or a pool: piscina
import Piscina from 'piscina';
const pool = new Piscina({ filename: new URL('./workers/thumbnail.js', import.meta.url).href, maxThreads: 2 });
const png = await pool.run({ key });
```

Rules: keep the worker file dependency-light; pass ids/keys, not large
objects (structured clone copies them); bound the pool. Consider moving the
work to a separate job worker process instead, which also isolates crashes.

## Environment flags worth knowing

| Flag / var | Purpose |
| --- | --- |
| `NODE_ENV=production` | Frameworks and libraries optimise; Express caches views, etc. |
| `NODE_OPTIONS=--max-old-space-size=<MB>` | Heap ceiling; set to ~75% of the container memory limit |
| `--enable-source-maps` | Readable stacks from compiled `dist/` |
| `UV_THREADPOOL_SIZE` | Larger thread pool for heavy fs/crypto/zlib |
| `--env-file=.env.local` | Load env without dotenv (local only) |

## Restart behaviour

Crash → exit 1 → platform restarts. Crash loops (restart within seconds
repeatedly) indicate a startup failure (config, migration, port); the
platform's restart backoff plus a clear fatal log line is the diagnostic.

## Related

- [event-loop.md](event-loop.md)
- [graceful-shutdown.md](graceful-shutdown.md)
- [13-docker/README.md](../13-docker/README.md)
