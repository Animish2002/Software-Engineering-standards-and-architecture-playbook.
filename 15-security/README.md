# 15 — Security

Application security for the full stack. Each page states the threat, the
default control, and what it looks like in this stack's code.

| Document | Threat / topic |
| --- | --- |
| [authentication.md](authentication.md) | Proving identity: passwords, hashing, credential flows, MFA. |
| [authorization.md](authorization.md) | Enforcing what an identity may do: RBAC with permission keys, resource scope, tiers. |
| [jwt.md](jwt.md) | Access tokens done safely. |
| [sessions.md](sessions.md) | Server sessions and refresh tokens; revocation. |
| [csrf.md](csrf.md) | Cross-site request forgery: when it applies, cookie settings, tokens. |
| [cors.md](cors.md) | What CORS does and doesn't protect. |
| [xss.md](xss.md) | Injection into the page; CSP; sanitising. |
| [sql-injection.md](sql-injection.md) | Parameterised queries; Drizzle's `sql` tag. |
| [secrets.md](secrets.md) | Storing, injecting, rotating; what never goes in Git. |
| [input-validation.md](input-validation.md) | Boundary validation as a security control; output encoding. |
| [http-headers.md](http-headers.md) | Security headers and secure cookies. |
| [dependencies.md](dependencies.md) | Supply chain: audits, lockfiles, updates. |
| [security-checklist.md](security-checklist.md) | The one-page checklist. |

Two adjacent areas have their own sections:
[26-oauth/security.md](../26-oauth/security.md) for social login and SSO, and
[25-file-handling/validation-and-security.md](../25-file-handling/validation-and-security.md)
for uploads.

## Principles

1. **Least privilege**: users, tokens, database roles, storage tokens, CI credentials, containers.
2. **Enforce on the server**; the frontend only hides.
3. **Validate every input; encode every output.**
4. **Secrets are never in code, images, URLs, or logs.**
5. **Fail closed**: an error in an auth check is a denial, not a pass.
6. **Uniform responses** where information leaks matter (login failures, password reset, 404 for invisible resources).
7. **Defense in depth**: WAF + rate limits + validation + constraints + audit.
