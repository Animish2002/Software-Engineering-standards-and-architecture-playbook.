# 02 — Backend

Framework-agnostic standards for a Node.js / Workers backend. Express- and
Hono-specific implementations are in [07-express/](../07-express/README.md)
and [08-hono/](../08-hono/README.md); API contract rules are in
[05-apis/](../05-apis/README.md).

| Document | Answers |
| --- | --- |
| [architecture.md](architecture.md) | Which structure for which size of backend, with the reference layout. |
| [code-organization.md](code-organization.md) | Exactly where each kind of file goes. |
| [layers.md](layers.md) | Controllers, services, repositories: responsibilities and rules. |
| [validation.md](validation.md) | Validate at the boundary with shared Zod schemas. |
| [authentication.md](authentication.md) | JWT access + refresh cookie, password hashing, session lifecycle. |
| [authorization.md](authorization.md) | Permission-key RBAC, resource ownership, where checks live. |
| [error-handling.md](error-handling.md) | Backend-specific application of the system error strategy. |
| [logging.md](logging.md) | Request logging and audit trails. |
| [caching.md](caching.md) | What to cache, where, and how to invalidate. |
| [background-jobs.md](background-jobs.md) | Work that must not block a request. |
| [configuration.md](configuration.md) | Backend config module and environment handling. |
| [production-readiness.md](production-readiness.md) | Health checks, shutdown, limits, headers. |

Security and performance are cross-cutting and have their own sections:
[15-security/](../15-security/README.md), [17-performance/backend.md](../17-performance/backend.md).
Testing: [16-testing/](../16-testing/README.md).

## The reference request pipeline

```text
request
  → request id + logger
  → security headers, CORS
  → body parsing (size-limited)
  → rate limit
  → authenticate (JWT → req.user with permission keys)
  → route
      → requirePermission('x:y')
      → controller: parse & validate → service → shape response
  → error handler (single)
response
```
