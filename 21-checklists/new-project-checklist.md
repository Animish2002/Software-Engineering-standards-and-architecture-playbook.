# New project checklist

## Define

- [ ] Requirements written: users, core flows, non-goals, constraints (budget, compliance, scale expectations).
- [ ] Architecture chosen with [23-decision-guides/architecture.md](../23-decision-guides/architecture.md): monolith (default), feature modules.
- [ ] Runtime chosen: Node + Express, or Hono on Workers ([23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md)).
- [ ] Database chosen: Postgres (default) or MySQL ([23-decision-guides/databases.md](../23-decision-guides/databases.md)).
- [ ] Deployment chosen: platform / Docker / Workers; Kubernetes only with a written reason ([23-decision-guides/deployment.md](../23-decision-guides/deployment.md)).
- [ ] Modules/features listed; names agreed (same names in API and web).
- [ ] Non-obvious decisions recorded in `docs/decisions/`.

## Design

- [ ] Entities, relationships, invariants written down; schema drafted ([03-databases/schema-design.md](../03-databases/schema-design.md)).
- [ ] Primary key strategy chosen (UUID v7 default).
- [ ] Soft-delete policy per table; permanent-delete policy stated.
- [ ] Hot queries listed; indexes planned.
- [ ] API contract drafted: endpoints, envelope, error codes, pagination style ([05-apis/rest-api-design.md](../05-apis/rest-api-design.md)).
- [ ] Auth design: JWT + refresh cookie (default) or server sessions.
- [ ] Authorization model: permission keys + roles; resource scope rules.
- [ ] Frontend architecture: feature folders, layouts, state homes, API layer ([10-frontend/architecture.md](../10-frontend/architecture.md)).
- [ ] Shared components catalog planned ([10-frontend/components/catalog.md](../10-frontend/components/catalog.md)).
- [ ] Error strategy: `AppError` hierarchy, one error middleware, result type on the client.
- [ ] Background-job need identified (or explicitly none).

## Scaffold

- [ ] Monorepo from [20-project-templates/fullstack/](../20-project-templates/fullstack/README.md); `@app/*` renamed.
- [ ] `packages/shared-types`, `packages/validation`, `packages/db` created.
- [ ] Config module with Zod validation; `.env.example` complete; `.env*` ignored.
- [ ] Logger (pino), request context, error handler, `ok`/`fail` wired.
- [ ] `authenticate` + `requirePermission` middleware; RBAC seed reconciling.
- [ ] HTTP client + cache layer + `CurrentUserProvider` on the web.
- [ ] shadcn initialised; tokens set; `common/` states + `ConfirmDialog` + `PageHeader` created.
- [ ] Docker Compose for Postgres; `docs/LOCAL-SETUP.md`.

## Tooling

- [ ] TypeScript strict everywhere.
- [ ] ESLint + Prettier (+ Tailwind plugin) with scripts; boundaries rule for module imports.
- [ ] Vitest in both apps; API test harness (`NODE_ENV=test`, test keys).
- [ ] CI: lint, typecheck, unit, migrate+check, build, API tests, audit ([18-devops/ci-cd.md](../18-devops/ci-cd.md)).
- [ ] Branch protection on `main`; PR template; Dependabot; secret scanning.
- [ ] `CLAUDE.md` + project skills from [24-claude-skills/](../24-claude-skills/README.md).

## Operate

- [ ] Environments: local, test, staging, production; nothing shared.
- [ ] Secrets in platform stores; rotation runbook.
- [ ] `/health` and `/health/system`; `db:check`; external uptime monitor.
- [ ] Logs structured with request ids; alerting on 5xx and health.
- [ ] Backups enabled and restore tested.
- [ ] README with endpoints, permissions, schema, routes, known gaps; CHANGELOG started.

## Review

- [ ] [security-checklist.md](security-checklist.md) walked.
- [ ] [performance-checklist.md](performance-checklist.md) walked with realistic data.
- [ ] [production-checklist.md](production-checklist.md) before first deploy.
