# Graceful shutdown

## Why

Platforms send `SIGTERM` on deploy, scale-down, and restart. Without
handling: in-flight requests are cut, pooled connections are dropped
mid-transaction, jobs are lost. With handling: the process stops accepting
new work, finishes what it has, closes resources, and exits within the
platform's grace period (usually 10-30 s).

## Sequence

```text
SIGTERM
 1. mark unhealthy (readiness probe fails) so the load balancer stops routing
 2. server.close()            stop accepting; wait for in-flight requests
 3. stop job workers          finish current job, don't claim new ones
 4. close DB pool, queues, other clients
 5. exit 0
 hard deadline: exit 1 after N seconds regardless
```

## Implementation

```ts
let shuttingDown = false;

export function isShuttingDown() { return shuttingDown; }

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutdown: start');

  const deadline = setTimeout(() => { logger.error('shutdown: deadline exceeded'); process.exit(1); }, 15_000);
  deadline.unref();

  await new Promise<void>((resolve) => server.close(() => resolve()));   // waits for keep-alive connections to finish
  server.closeIdleConnections?.();                                        // Node 18.2+
  await jobWorker?.stop();
  await pool.end();
  logger.info('shutdown: complete');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
```

- Readiness endpoint returns 503 when `isShuttingDown()` so the balancer drains.
- `server.close()` waits for open connections; set `server.keepAliveTimeout` lower than the balancer's idle timeout and call `closeIdleConnections()` so idle keep-alives don't hold the process.
- `setInterval` timers in the app should be `.unref()`'d or cleared here.

## Docker and PID 1

In a container, Node must receive the signal. Use the exec form
(`CMD ["node", "dist/server.js"]`), not `CMD npm start` (npm doesn't
forward signals reliably). If something must wrap Node, use `tini`
(`--init` flag) or `dumb-init`.

## Kubernetes

`terminationGracePeriodSeconds` ≥ your deadline + a margin; a `preStop`
sleep of a few seconds helps endpoints propagate before `SIGTERM`.

## Related

- [error-handling.md](error-handling.md)
- [13-docker/dockerfile.md](../13-docker/dockerfile.md)
- [14-kubernetes/health-checks.md](../14-kubernetes/health-checks.md)
