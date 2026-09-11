# Logging and audit (backend)

General rules are in
[00-engineering-principles/logging.md](../00-engineering-principles/logging.md).
This page covers the two backend-specific concerns: request logging and the
audit trail, which are not the same thing.

## Request logs vs. audit log

| | Request log | Audit log |
| --- | --- | --- |
| Purpose | Debugging, performance, incident response | Accountability: who did what to which record |
| Storage | stdout → platform log viewer; retained days to weeks | Database table; retained as long as the business needs |
| Written by | Middleware, automatically | Controllers, explicitly, for mutating actions |
| Content | method, path, status, duration, reqId, userId | actorId, actorName, action, target id, detail, timestamp |
| Visible to | Engineers | Admins, via the product |

## Request logging middleware

```ts
export function requestContext(req, res, next) {
  const id = req.get('X-Request-Id') ?? crypto.randomUUID();
  req.id = id;
  req.log = logger.child({ reqId: id });
  res.setHeader('X-Request-Id', id);
  if (req.path === '/health') return next();           // don't log probes
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    req.log.info({ method: req.method, path: req.route?.path ?? req.path, status: res.statusCode, ms: Math.round(ms), userId: req.user?.id }, 'request');
  });
  next();
}
```

Log `req.route?.path` (`/users/:id`) rather than the raw path so metrics
group by route.

## Audit log

```sql
create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,  -- keep history if the user is purged
  actor_name    text not null,                                 -- denormalised: renames don't rewrite history
  action        text not null,                                 -- 'user.created', 'item.trashed'
  detail        jsonb,
  created_at    timestamptz not null default now()
);
create index idx_audit_logs_created_at on audit_logs (created_at desc);
```

```ts
// controller-level helper: the actor exists only on the request
const audit = (req, action: string, detail?: unknown) =>
  void logAction({ actorUserId: req.user.id, actorName: req.user.name, action, detail });
```

Two deliberate properties of `logAction`: it **never throws** (a failed
audit insert must not fail the action it records) and it is called with
`void` so the insert doesn't add latency before the response.

## What to audit

Every mutation that an admin might need to explain later: account
creation/deactivation, permission changes, deletions, shares created and
revoked, quota edits, password resets (the event, never the token). Not
reads, not health checks.

## Checklist

- [ ] Request summary line per request with reqId, route, status, duration.
- [ ] Health checks excluded.
- [ ] Audit table with denormalised actor name and `ON DELETE SET NULL`.
- [ ] Audit writes are fire-and-forget and never throw.
- [ ] Sensitive values never appear in either log.

## Related

- [05-apis/observability.md](../05-apis/observability.md)
- [03-databases/soft-deletes-and-audit-columns.md](../03-databases/soft-deletes-and-audit-columns.md)
