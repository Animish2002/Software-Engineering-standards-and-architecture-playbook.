# Image optimization

## `.dockerignore` (required)

```text
node_modules
**/node_modules
dist
**/dist
.git
.github
.vscode
.idea
*.md
!README.md
.env
.env.*
tests
**/*.test.ts
coverage
docs
*.log
.wrangler
apps/web            # the SPA isn't part of the API image
```

Without it, `COPY . .` sends everything (including `.env` and
`node_modules`) to the daemon and can leak secrets into layers.

## Size

| Technique | Effect |
| --- | --- |
| Multi-stage; copy only `dist/` + prod deps | Biggest win |
| `alpine` or `slim` base | 50-150 MB vs 1 GB for full Debian |
| `npm ci --omit=dev` in the runtime deps stage | Removes TypeScript, test tools |
| `npm cache clean --force` or the BuildKit cache mount | No npm cache in layers |
| Avoid heavy transitive deps (full AWS SDK when `aws4fetch` does) | Tens of MB |
| Prune unused workspace packages from the runtime copy | Only what the API imports |

Check: `docker image ls`, `docker history app-api`, `dive app-api`.

## Layer caching

- Order: base → manifests → install → source → build. A source change then only rebuilds from the source layer.
- Combine `RUN` commands that belong together; split ones that change at different rates.
- BuildKit cache mounts for npm; GitHub Actions cache (`cache-from: type=gha`) in CI.

## Startup

- Compiled JS (`dist/`), not `tsx`.
- Avoid heavy module-level work; connect the pool lazily or quickly.
- `--enable-source-maps` costs a little memory; keep it for readable stacks.

## Reproducibility

- Pin base image major (`node:22-alpine`); optionally by digest for strict reproducibility.
- `npm ci` with a committed lockfile.
- Build once, tag by commit SHA, promote the same image through environments.

## Related

- [multi-stage-builds.md](multi-stage-builds.md)
- [security.md](security.md)
