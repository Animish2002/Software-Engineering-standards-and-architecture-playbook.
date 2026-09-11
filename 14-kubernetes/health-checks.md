# Health checks (probes)

| Probe | Question | On failure | Endpoint | Should check |
| --- | --- | --- | --- | --- |
| **Startup** | Has the process finished starting? | Keeps waiting (up to `failureThreshold × period`); other probes are paused | `/health` | Process up |
| **Readiness** | Can this Pod take traffic right now? | Removed from Service endpoints; not restarted | `/health/ready` | Dependencies needed to serve (DB reachable with a short timeout); returns 503 during shutdown |
| **Liveness** | Is the process hung beyond recovery? | Container restarted | `/health` | Process up; **no** dependency checks |

## Why liveness must not check the database

If the database is down and liveness checks it, Kubernetes restarts every
API Pod in a loop, turning a database incident into an API outage with
constant cold starts. Readiness handles "don't send me traffic"; liveness
handles "I'm deadlocked".

## App-side

```ts
healthRouter.get('/', (_req, res) => res.json(ok({ status: 'ok' })));                         // liveness/startup
healthRouter.get('/ready', async (_req, res) => {
  if (isShuttingDown()) return res.status(503).json(fail('Shutting down', 'SHUTTING_DOWN'));
  const dbOk = await pingDb(1_000).catch(() => false);
  return res.status(dbOk ? 200 : 503).json(dbOk ? ok({ status: 'ready' }) : fail('Database unreachable', 'NOT_READY'));
});
```

Exclude probe requests from request logs.

## Timing

- Startup: `periodSeconds: 5`, `failureThreshold` sized to the slowest expected start (migrations aren't here, so 30-60 s is plenty).
- Readiness: `periodSeconds: 5`, `failureThreshold: 3`.
- Liveness: `periodSeconds: 15`, `timeoutSeconds: 2`, `failureThreshold: 3`.
- `terminationGracePeriodSeconds` ≥ app shutdown deadline + `preStop` sleep.

## Diagnostics endpoint

The privileged `/health/system` (DB latency, indexes, storage) is for
humans and dashboards, not for probes. Probes need fast, cheap, stable
answers.

## Related

- [deployments.md](deployments.md)
- [06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md)
- [02-backend/production-readiness.md](../02-backend/production-readiness.md)
