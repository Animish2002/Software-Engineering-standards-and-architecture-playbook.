# Template: Full-stack monorepo

Combines the other templates into one repository with npm workspaces.

```text
<project>/
├── package.json                  workspaces + root scripts
├── package-lock.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
├── .editorconfig
├── docker-compose.yml            local Postgres (13-docker/docker-compose.md)
├── CLAUDE.md                     (24-claude-skills/CLAUDE.md.template)
├── README.md
├── CHANGELOG.md
├── .claude/skills/               project skills (24-claude-skills)
├── .github/
│   ├── workflows/ci.yml          (18-devops/ci-cd.md)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── docs/
│   ├── LOCAL-SETUP.md
│   ├── DEPLOYMENT.md
│   └── decisions/
├── apps/
│   ├── web/                      react-vite template
│   └── api/                      express-node template   (or apps/worker: hono-worker)
├── packages/
│   ├── shared-types/             ApiResponse, User, DriveItem, AuthenticatedUser …
│   ├── validation/               Zod schemas shared by api and web
│   ├── db/                       drizzle-postgres template
│   └── storage/                  StorageProvider interface + R2 adapter
└── tests/
    └── api/                      Playwright request tests against the running API
```

Files in this folder: [package.json](package.json), [tsconfig.base.json](tsconfig.base.json),
[.env.example](.env.example), [docker-compose.yml](docker-compose.yml),
[.github/workflows/ci.yml](.github/workflows/ci.yml).

## First-day commands

```bash
npm ci
docker compose up -d
cp .env.example .env.local           # fill in
npm run db:migrate && npm run db:seed:rbac && npm run db:seed   # demo accounts, local only
npm run dev:api                      # :4000
npm run dev:web                      # :5173
```

## Where things go

| Thing | Location |
| --- | --- |
| A type both apps use | `packages/shared-types` |
| A validation rule both use | `packages/validation` |
| A new API feature | `apps/api/src/modules/<feature>/` |
| A new screen | `apps/web/src/features/<feature>/` + a route |
| A schema change | `packages/db/src/schema/*.ts` → `npm run db:generate -- --name=…` |
| An infra/ops note | `docs/DEPLOYMENT.md` |
| A non-obvious decision | `docs/decisions/NNNN-title.md` |

Standards: the whole playbook; start at [21-checklists/new-project-checklist.md](../../21-checklists/new-project-checklist.md).
