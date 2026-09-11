# Audit log

```sql
create table audit_logs (
  id            bigint generated always as identity primary key,
  actor_user_id uuid references users(id) on delete set null,
  actor_name    text not null,
  action        text not null,
  resource_type text,
  resource_id   uuid,
  detail        jsonb,
  ip            inet,
  created_at    timestamptz not null default now()
);
create index idx_audit_logs_created_at on audit_logs (created_at desc);
create index idx_audit_logs_actor_created on audit_logs (actor_user_id, created_at desc);
create index idx_audit_logs_resource on audit_logs (resource_id) where resource_id is not null;
```

```ts
// services/audit.service.ts
export type AuditEntry = { actorUserId: string; actorName: string; action: string; resourceType?: string; resourceId?: string; detail?: unknown; ip?: string };

/** Never throws; never awaited by callers (void logAction(...)). */
export async function logAction(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values(entry);
  } catch (err) {
    logger.warn({ err, action: entry.action }, 'audit write failed');
  }
}

// controller helper (actor only exists on the request)
export const audit = (req: Request, action: string, extra: Partial<Omit<AuditEntry, 'actorUserId' | 'actorName' | 'action'>> = {}) =>
  void logAction({ actorUserId: req.user!.id, actorName: req.user!.name, action, ip: req.ip, ...extra });

// usage
audit(req, 'user.created', { resourceType: 'user', resourceId: user.id, detail: { email: user.email } });
```

Read endpoint: newest first, `page`/`pageSize` ≤ 100, gated by
`audit:view`.

Related: [02-backend/logging.md](../../02-backend/logging.md)
