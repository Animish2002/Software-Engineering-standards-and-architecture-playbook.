# Changelog

Notable changes to the standards, newest first. Record *what changed in the
recommendation* and *why*, not just which file was edited.

## 2026-09 (3)

- Added `25-file-handling/`. The default is now **presigned direct-to-storage
  uploads against a private bucket, with a database row that owns the
  metadata** — the API issues permission and records facts rather than moving
  bytes. Covers upload strategies, the validation and security threat list
  (type spoofing, SVG/XSS, traversal, decompression bombs, quotas), key design
  and orphan reconciliation, private-by-default serving, image processing, and
  the React upload UX. The repository assumed presigned uploads in passing
  (`02-backend/production-readiness.md`) but never documented how to do one
  safely.
- Added `26-oauth/`. Default recommendation: **authorization code flow with
  PKCE via Arctic, terminating in the existing JWT + refresh-cookie session**
  — OAuth replaces the credential check, not the session system. Covers the
  flow and why each control exists, a library comparison (Arctic vs
  openid-client vs Better Auth vs Auth.js vs Passport vs hosted), an
  end-to-end implementation, Google/Microsoft Entra/GitHub specifics, and
  account linking. The account-linking rule is the load-bearing one:
  **key on the provider's `sub`, and never link on an unverified email**,
  because doing so is a straightforward account takeover.
- Added `27-observability/`. Framed as a ladder to climb in order, with
  tracing explicitly last and optional — a modular monolith answers nearly
  every latency question from timed log lines. Covers metrics (RED/USE,
  cardinality as the cost), error tracking (capture 5xx only; 4xx noise is
  what kills the practice), alerting and SLOs (symptoms not causes; page vs
  ticket; burn-rate alerts), dashboards, and frontend monitoring. Logging was
  already owned by `00-engineering-principles/logging.md` and is linked, not
  repeated.

## 2026-09 (2)

- Added a TypeScript subsection to `22-javascript/`: configuration
  (strict-mode flags explained, monorepo project references),
  `type` vs `interface`, generics and utility types, narrowing and
  discriminated unions, advanced types used sparingly (`satisfies`,
  mapped/conditional/template-literal/branded types), and TypeScript-
  specific anti-patterns (`any`, non-null assertions, `as`, enums).
  The section was JavaScript-only despite the repo-wide "TypeScript
  strict everywhere" rule; every code example elsewhere already assumed
  it without a dedicated reference.

## 2026-09

- Initial release of the playbook: engineering principles, project
  architecture, backend, databases, Drizzle ORM, APIs, Node.js, Express, Hono,
  Cloudflare, frontend (React + Vite), Tailwind, shadcn/ui, Docker, Kubernetes,
  security, testing, performance, DevOps, reusable patterns, project
  templates, checklists, JavaScript, decision guides, Claude Code skills, and
  examples.
- Default recommendations established: modular monolith over microservices;
  feature/module-based folder layout; keyset pagination for infinite lists and
  offset for admin tables; `{ success, data | error }` API envelope; Zod as
  the single validation layer shared between API and forms; Tailwind v4
  CSS-first tokens; Kubernetes only when a documented need exists.
