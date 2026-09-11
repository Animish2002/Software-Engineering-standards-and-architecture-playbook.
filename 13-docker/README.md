# 13 — Docker

Containers for reproducible builds and local infrastructure. Not every
project needs a Dockerfile; every project with a database needs
`docker-compose` for local Postgres/MySQL.

| Document | Answers |
| --- | --- |
| [dockerfile.md](dockerfile.md) | The production Dockerfile for a Node API in a monorepo. |
| [multi-stage-builds.md](multi-stage-builds.md) | Why and how to separate build from runtime. |
| [docker-compose.md](docker-compose.md) | Local databases and services; dev containers. |
| [image-optimization.md](image-optimization.md) | Size, layers, cache, `.dockerignore`. |
| [security.md](security.md) | Non-root, pinned bases, secrets, scanning. |
| [production-checklist.md](production-checklist.md) | Pre-ship list. |

## When to use Docker

| Situation | Docker? |
| --- | --- |
| Local Postgres/MySQL/Redis for development | **Yes** (compose). Never install databases on the host per project. |
| Deploying to a platform that builds from source (Railway Railpack, Render, Cloudflare) | Optional. Use it when the source build keeps breaking on monorepo quirks, or you need an exact runtime. |
| Deploying to a VM, ECS, Fly, Kubernetes | Yes. |
| Cloudflare Workers / Pages | No. |
| CI test jobs needing a database | Yes (service containers). |

See [23-decision-guides/deployment.md](../23-decision-guides/deployment.md).
