# Changelog

Notable changes to the standards, newest first. Record *what changed in the
recommendation* and *why*, not just which file was edited.

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
