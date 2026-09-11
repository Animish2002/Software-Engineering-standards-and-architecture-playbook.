# Docker production checklist

- [ ] Multi-stage Dockerfile; runtime stage has only `dist/`, prod deps, manifests, migrations.
- [ ] Base image pinned (`node:22-alpine` or `-slim`); rebuilt on a schedule.
- [ ] `.dockerignore` excludes `.git`, `.env*`, `node_modules`, tests, docs, the SPA.
- [ ] `USER node`; files `--chown=node:node`.
- [ ] `tini` (or `--init`) + exec-form `CMD`; graceful shutdown verified with `docker stop`.
- [ ] `HEALTHCHECK` hitting the public liveness route.
- [ ] `NODE_ENV=production`; `PORT` respected from the environment.
- [ ] No secrets in the image or build args; injected at runtime.
- [ ] Image scanned (Trivy/Scout) in CI; high CVEs fixed or accepted with a note.
- [ ] Image tagged by commit SHA; same image promoted across environments.
- [ ] Migrations run as a separate release step.
- [ ] Logs to stdout/stderr (no files).
- [ ] Memory limit set on the container and `--max-old-space-size` matched to it.
- [ ] Read-only root filesystem and dropped capabilities where the platform allows.

## Related

- [21-checklists/production-checklist.md](../21-checklists/production-checklist.md)
- [06-nodejs/production-checklist.md](../06-nodejs/production-checklist.md)
