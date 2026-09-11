# CI/CD

## The pipeline

```text
push / PR
 ↓
install (npm ci, cached)
 ↓
lint  ─┐
typecheck ─┤  parallel
unit tests ─┘
 ↓
integration + API tests   (Postgres service container; API started with NODE_ENV=test)
 ↓
build (packages → api → web)
 ↓
security checks (npm audit high; secret scan; image scan if Docker)
 ↓
[main] deploy staging → migrate → deploy → health check → smoke test
 ↓
[tag]  deploy production → migrate → deploy → health check → smoke test
```

## `ci.yml`

```yaml
name: ci
on:
  pull_request:
  push: { branches: [main] }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
permissions: { contents: read }

jobs:
  checks:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: app_test }
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U app" --health-interval 5s --health-timeout 3s --health-retries 10
    env:
      DATABASE_URL: postgres://app:app@localhost:5432/app_test
      NODE_ENV: test
      JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
      JWT_REFRESH_SECRET: ${{ secrets.TEST_JWT_REFRESH_SECRET }}
      CORS_ORIGIN: http://localhost:5173
      TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA   # Cloudflare's always-pass test secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test            # unit, all workspaces
      - run: npm run db:migrate && npm run db:seed:rbac && npm run db:check
      - run: npm run build
      - name: API tests
        run: |
          npm run start -w apps/api & 
          npx wait-on http://localhost:4000/health
          npm run test:api
      - run: npm audit --audit-level=high
```

## Per-target differences

| Target | Build | Deploy | Migrate | Health |
| --- | --- | --- | --- | --- |
| **Frontend (Pages)** | `npm run build -w apps/web` with `VITE_API_URL` per env | `wrangler pages deploy apps/web/dist` or Git integration; preview per PR | n/a | Load `/` and check the API call to `/health` from the app |
| **Node API (Railway/Render)** | Platform builds from source (Railpack) with root install + `build:packages && build:api`, or you push a Docker image | Platform deploy on push/branch or via CLI (`railway up`) | Release/pre-deploy command: `npm run db:migrate` then `db:check` | Platform health check on `/health`; external uptime monitor |
| **Docker (VM/ECS/Fly)** | `docker build` in CI, tag `sha-<commit>`, push to registry; Trivy scan | Pull + restart (Compose) or `fly deploy`; same image promoted staging → prod | Separate `docker run … migrate` before restarting the app | Container `HEALTHCHECK` + LB health |
| **Cloudflare Workers** | `wrangler deploy --dry-run --outdir dist` as build check | `wrangler deploy --env staging` / `--env production` via `wrangler-action` | Hyperdrive/Postgres: run migrations from CI against the target DB before deploy; D1: `wrangler d1 migrations apply` | `curl https://api…/health`; `wrangler tail` for errors |
| **Kubernetes** | Docker image as above | Update image tag in the manifests repo (GitOps) or `helm upgrade`; Argo/Flux syncs | Migration `Job` as a pre-upgrade hook | Rollout status + probes; rollback via `rollout undo`/Git revert |

## Monorepo gotchas

- Install from the **root** (`npm ci`), never inside `apps/api` alone; workspace packages must resolve.
- Build packages before apps; make the root `build` script do it in order.
- Platform builders that auto-detect one app can miss the workspace; set the build command explicitly.
- Cache `~/.npm` keyed on the lockfile.

## Deploy gating

- Staging: automatic on `main`.
- Production: on tag, with a required reviewer on the GitHub `production` environment, or a manual `workflow_dispatch`.
- Never deploy from a laptop.

## Rollback

- Frontend: redeploy the previous build.
- API: redeploy the previous image/commit; migrations are forward-compatible (expand/contract) so the old code runs against the new schema.
- Workers: `wrangler rollback`.

## Related

- [environments.md](environments.md)
- [09-cloudflare/deployment.md](../09-cloudflare/deployment.md)
- [13-docker/dockerfile.md](../13-docker/dockerfile.md)
