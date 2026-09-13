# write-new-ways

A personal software-engineering standards and architecture playbook.

Open this repository whenever you start a new project, find the technology
you are using, and follow the recommended structure, patterns, and checklists.
It is opinionated on purpose: one recommended way, with alternatives named
only where the tradeoff is real.

## Why this exists

Every new project re-asks the same questions: where does this code go, how
should the database be shaped, where do indexes belong, how should the API
respond, how do I keep React components from being copy-pasted three times.
Answering them fresh each time produces inconsistent projects and repeated
mistakes. This repository answers them once, with examples, so a new project
starts from a known-good baseline instead of from memory.

## How to use it

1. Start with [21-checklists/new-project-checklist.md](21-checklists/new-project-checklist.md).
2. Use [23-decision-guides/](23-decision-guides/) for the architectural choices
   the checklist asks you to make.
3. Open the technology sections for the stack you picked (see the quick start).
4. Copy a starting structure from [20-project-templates/](20-project-templates/).
5. Before shipping, run the production checklist in
   [21-checklists/production-checklist.md](21-checklists/production-checklist.md).

Every major document follows the same shape: what it is, why it matters, when
to use it, when not to, the recommended approach, a good and a bad example,
common mistakes, production considerations, and a checklist. Skip to the
section you need.

## Quick start

```text
Starting a new React project?
→ 10-frontend/            architecture, components, state, API layer
→ 11-tailwind/            styling without duplication
→ 12-shadcn/              UI primitives and composition
→ 20-project-templates/react-vite/
→ 21-checklists/frontend-checklist.md

Starting a backend?
→ 02-backend/             framework-agnostic structure and layering
→ 22-javascript/          language fundamentals — JavaScript and TypeScript
→ 06-nodejs/              runtime behaviour, production config
→ 07-express/  or  08-hono/
→ 05-apis/                REST contracts, errors, pagination
→ 21-checklists/backend-checklist.md

Using PostgreSQL / MySQL + Drizzle?
→ 03-databases/           schema, indexing, query optimization
→ 04-drizzle-orm/
→ 20-project-templates/drizzle-postgres/
→ 21-checklists/database-checklist.md

Accepting file uploads?
→ 25-file-handling/        presigned uploads, validation, storage, serving
→ 25-file-handling/file-handling-checklist.md

Adding "Sign in with Google/Microsoft"?
→ 26-oauth/                the flow, choosing a library, providers, account linking
→ 26-oauth/oauth-checklist.md

Deploying?
→ 13-docker/
→ 14-kubernetes/          (read "when not to use it" first)
→ 09-cloudflare/
→ 18-devops/
→ 27-observability/        know when it breaks before users tell you
→ 21-checklists/production-checklist.md

Making a decision?
→ 23-decision-guides/

Working with Claude Code on the project?
→ 24-claude-skills/       CLAUDE.md template and reusable skills
```

## Core technologies vs. supporting vs. optional

| Tier | Technologies | Notes |
| --- | --- | --- |
| **Core (used on every project)** | JavaScript/TypeScript, React, Vite, Tailwind CSS, shadcn/ui, Node.js, Express or Hono, PostgreSQL or MySQL, Drizzle ORM, Git, GitHub | Documented in depth. |
| **Recommended supporting** | Zod (validation), pino (logging), Vitest (tests), ESLint + Prettier, Docker, GitHub Actions, Cloudflare (Workers, Pages, R2), TanStack Query (server state), React Router, Sentry (error tracking), Arctic (OAuth), AWS SDK v3 S3 client (object storage) | Needed to make the core stack production-ready. Each is justified where introduced. |
| **Optional (only when the need is proven)** | Kubernetes, Redis, message queues, Durable Objects, Playwright (E2E), OpenTelemetry, Zustand, prom-client (metrics), sharp (image processing), Better Auth / openid-client (auth frameworks) | Each has a "when not to use it" section. Do not add them by default. |

## Directory structure

```text
00-engineering-principles/   clean code, DRY/KISS/YAGNI, naming, abstraction, errors, logging, config
01-project-architecture/     monolith, modular monolith, microservices, layered, feature-based, choosing
02-backend/                  framework-agnostic backend structure, layers, validation, auth, caching
03-databases/                schema design, constraints, indexing, query optimization, transactions, PG/MySQL
04-drizzle-orm/              schema, relations, migrations, queries, transactions, performance
05-apis/                     REST design, status codes, envelopes, errors, pagination, versioning, security
06-nodejs/                   event loop, async, streams, errors, shutdown, memory, production config
07-express/                  project structure, middleware, controllers/services/repositories, security
08-hono/                     project structure, routing, validation, bindings, Workers
09-cloudflare/               Workers, bindings, caching, Durable Objects, Queues, deployment
10-frontend/                 React + Vite architecture, components, hooks, state, API layer, forms
11-tailwind/                 organization, tokens, responsive, reusable patterns, dark mode
12-shadcn/                   organization, customization, variants, composition, forms, tables
13-docker/                   Dockerfile, multi-stage builds, compose, image size, security
14-kubernetes/               when to use it, core objects, probes, limits, autoscaling
15-security/                 auth, JWT, sessions, CSRF, CORS, XSS, injection, secrets, headers
16-testing/                  unit, integration, API, frontend, database, strategy
17-performance/              backend, database, frontend, API, caching, profiling
18-devops/                   git, GitHub, branching, PRs, CI/CD, environments, secrets
19-reusable-patterns/        copy-ready code: result types, error classes, pagination, API client, hooks
20-project-templates/        starting structures: react-vite, express-node, hono-worker, drizzle-postgres, fullstack
21-checklists/               one-page checklists for every phase
22-javascript/               modern JS syntax, async, closures, memory, TypeScript types/generics/narrowing, anti-patterns
23-decision-guides/          decision trees for the recurring architectural choices
24-claude-skills/            CLAUDE.md template and Claude Code skills to add to each project
25-file-handling/            uploads, validation, storage keys, serving, image processing
26-oauth/                    social login and SSO: the flow, libraries, providers, account linking
27-observability/            metrics, error tracking, alerting and SLOs, dashboards, tracing
examples/                    small, complete examples referenced from the docs
```

## Reading paths by concern

| I want to... | Read, in order |
| --- | --- |
| Structure a backend that stays maintainable | 01 → 02-backend/architecture.md → 02-backend/layers.md → 07 or 08 |
| Design a schema and make it fast | 03-databases/schema-design.md → constraints.md → indexing.md → query-optimization.md → 04-drizzle-orm/ |
| Stop duplicating React UI | 10-frontend/components/ → 12-shadcn/composition.md → 11-tailwind/avoiding-duplication.md |
| Ship to production safely | 21-checklists/production-checklist.md → 13-docker → 18-devops/ci-cd.md → 15-security/security-checklist.md |
| Accept file uploads without a security hole | 25-file-handling/upload-strategies.md → validation-and-security.md → serving-and-access.md |
| Add social login | 26-oauth/how-it-works.md → choosing-a-library.md → implementation.md → account-linking.md |
| Find out about outages before users do | 27-observability/README.md → error-tracking.md → alerting-and-slos.md |
| Decide between two options | 23-decision-guides/ |

## Keeping the standards current

These are living documents. When a project teaches you something, update the
relevant file the same week, and record it in [CHANGELOG.md](CHANGELOG.md).
Rules for edits are in [CONTRIBUTING.md](CONTRIBUTING.md). Conventions:

- One topic per file; link instead of repeating.
- Every recommendation says when *not* to apply it.
- Code examples are minimal, modern, and labelled **Recommended**, **Alternative**, or **Avoid**.
- Version-sensitive claims (framework APIs, CLI flags) should be re-checked against official documentation before being relied on. Versions assumed at the time of writing are listed in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
