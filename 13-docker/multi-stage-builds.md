# Multi-stage builds

## What is it?

Several `FROM` stages in one Dockerfile. Early stages install tooling and
compile; the final stage copies only the artefacts it needs. Everything
else (compilers, dev dependencies, source, caches) never reaches the
runtime image.

## Why

| Single stage | Multi-stage |
| --- | --- |
| Image contains TypeScript, test files, dev deps, `.git` if not ignored | Image contains `dist/`, prod deps, the runtime |
| 800 MB+ | 150-250 MB |
| Larger attack surface | Smaller |
| Secrets used at build time can leak into layers | Build stages are discarded |

## Stage roles

```text
base       runtime image + common env (WORKDIR, NODE_ENV, tini)
deps       full install (dev deps) for building
build      compile TS → dist/
prod-deps  production-only install
runtime    base + prod-deps node_modules + dist
```

Order stages so the ones that change least come first; Docker caches per
layer per stage.

## Build-time secrets

Never `ARG NPM_TOKEN` + `ENV`: it persists in the image. Use BuildKit
secrets:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

```bash
docker build --secret id=npmrc,src=$HOME/.npmrc .
```

## Targeting a stage

```bash
docker build --target build -t app-api:build .   # run tests against the build stage in CI
docker build -t app-api:latest .                  # final stage by default
```

## Common mistakes

- Copying the whole `node_modules` from the build stage (includes dev deps).
- Running `npm install` in the runtime stage (no lockfile discipline; adds npm cache).
- Not copying migration SQL files when the runtime runs migrations.
- Forgetting `package.json` files that Node needs to resolve workspace packages (`exports`, `type: module`).

## Related

- [dockerfile.md](dockerfile.md)
- [image-optimization.md](image-optimization.md)
