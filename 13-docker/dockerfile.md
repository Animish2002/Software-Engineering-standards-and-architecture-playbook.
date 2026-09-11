# Dockerfile for a Node API (monorepo)

```dockerfile
# syntax=docker/dockerfile:1.7

# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tini

# ---------- deps: install ALL deps (needed to build TS) ----------
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validation/package.json packages/validation/
COPY packages/storage/package.json packages/storage/
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- build ----------
FROM deps AS build
COPY . .
RUN npm run build -w packages/shared-types -w packages/validation -w packages/db -w packages/storage \
 && npm run build -w apps/api

# ---------- prod deps only ----------
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validation/package.json packages/validation/
COPY packages/storage/package.json packages/storage/
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---------- runtime ----------
FROM base AS runtime
USER node
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/package.json ./
COPY --chown=node:node --from=build /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=build /app/apps/api/package.json ./apps/api/
COPY --chown=node:node --from=build /app/packages/db/dist ./packages/db/dist
COPY --chown=node:node --from=build /app/packages/db/package.json ./packages/db/
COPY --chown=node:node --from=build /app/packages/db/drizzle ./packages/db/drizzle
COPY --chown=node:node --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --chown=node:node --from=build /app/packages/shared-types/package.json ./packages/shared-types/
COPY --chown=node:node --from=build /app/packages/validation/dist ./packages/validation/dist
COPY --chown=node:node --from=build /app/packages/validation/package.json ./packages/validation/
COPY --chown=node:node --from=build /app/packages/storage/dist ./packages/storage/dist
COPY --chown=node:node --from=build /app/packages/storage/package.json ./packages/storage/

EXPOSE 4000
ENV PORT=4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "apps/api/dist/server.js"]
```

## Why each part

| Line | Reason |
| --- | --- |
| `node:22-alpine` pinned major | Small image; predictable runtime. Use `-slim` (Debian) if a native module fails on musl. |
| `tini` + exec-form `CMD` | Signals reach Node (graceful shutdown); zombie reaping |
| Separate `deps` / `prod-deps` | Build needs dev deps (TypeScript); runtime doesn't |
| Copy `package.json`s before source | Dependency layer is cached until a manifest changes |
| `--mount=type=cache` for npm | Faster rebuilds without bloating layers |
| `USER node` | Non-root runtime |
| Copy only `dist/` and manifests | No source, no tests, no `.env` in the image |
| `HEALTHCHECK` | Orchestrators restart unhealthy containers; hits the public liveness route |
| `EXPOSE`/`PORT` | Documentation + default; platforms override `PORT` |

## Single-package variant

Drop the workspace copies; `COPY package*.json ./ && npm ci`, build, then
copy `dist/` + prod `node_modules`.

## Migrations

Run as a separate step/job, not in `CMD`:

```bash
docker run --rm -e DATABASE_URL=… app-api node packages/db/dist/scripts/migrate.js
```

Or a release command on the platform. Never at process start on
multi-instance deployments without a lock.

## Frontend

Don't containerise a Vite SPA; it's static files for Pages/S3/CDN. If you
must, build in a stage and serve `dist/` with `nginx:alpine` or `caddy`
with SPA fallback.

## Related

- [multi-stage-builds.md](multi-stage-builds.md)
- [image-optimization.md](image-optimization.md)
- [06-nodejs/graceful-shutdown.md](../06-nodejs/graceful-shutdown.md)
