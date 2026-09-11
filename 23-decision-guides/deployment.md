# Docker vs no Docker; Kubernetes vs simpler deployment

## Docker vs no Docker

```text
Deploying to Cloudflare Workers/Pages? ─────────────────► No Docker (not applicable)

Deploying to a platform that builds from source
(Railway, Render, Fly's buildpacks) and it's working fine? ─► No Docker needed — let the platform build it

Do you need: an exact reproducible runtime, a database for local dev,
or a target that only accepts images (ECS, most Kubernetes, some VMs)? ─► Docker
```

Docker for **local Postgres/MySQL/Redis is a near-universal yes**
regardless of the above — never install a database directly on a
development machine per project. See
[13-docker/docker-compose.md](../13-docker/docker-compose.md). Docker for
**deploying the app itself** is only a yes when the target needs an image
or the source-build path keeps breaking on monorepo quirks.

## Kubernetes vs a simpler deployment

```text
All of these true?
  - Several services (roughly 10+) from multiple teams
  - An ops-capable team willing to own cluster upgrades, node
    pools, ingress, cert renewal, network policy
  - A requirement a platform genuinely can't meet (GPU scheduling,
    custom networking, strict multi-tenant isolation, on-prem/air-gapped)
  │
  ├── All yes ─────────────────────────────────────────► Managed Kubernetes (GKE/EKS/AKS) — never self-managed control planes
  │
  └── Any no ──────────────────────────────────────────► A platform (Railway/Render/Fly) or a VM + Docker Compose
```

The overwhelming majority of the projects this playbook targets stop at
"a platform." Kubernetes is not a maturity milestone — it's a specific
tool for a specific organisational shape. Running it without that shape
means paying its full operational cost (see
[14-kubernetes/architecture.md](../14-kubernetes/architecture.md)) for
none of its benefit.

## Choosing among "simpler" options

```text
Frontend (static SPA)?              ─► Cloudflare Pages (or Vercel/Netlify) — always this tier
API, no strong edge-latency need?   ─► Railway / Render / Fly — pick one, they're comparable
API, want edge latency + near-zero
  idle cost, I/O-bound workload?    ─► Cloudflare Workers
Need an exact runtime / already
  have images / target requires
  images (some CI/CD pipelines)?    ─► Docker on the same platforms above (most accept a Dockerfile too)
```

## Related

- [../13-docker/README.md](../13-docker/README.md)
- [../14-kubernetes/architecture.md](../14-kubernetes/architecture.md)
- [../09-cloudflare/architecture.md](../09-cloudflare/architecture.md)
