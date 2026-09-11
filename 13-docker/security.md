# Docker security

## Checklist with reasons

| Practice | Why |
| --- | --- |
| **Non-root user** (`USER node`) | A container escape or app RCE runs as an unprivileged user |
| **Pinned base image** (`node:22-alpine`, optionally `@sha256:…`) | Reproducible; no surprise runtime changes |
| **Minimal base** (alpine/slim/distroless) | Fewer packages, fewer CVEs |
| **No secrets in the image** (no `.env`, no `ARG` secrets) | Layers are readable by anyone with the image |
| **Secrets injected at runtime** (env from the platform, or mounted files) | Rotatable without a rebuild |
| **`.dockerignore`** | Keeps `.git`, `.env`, keys out of the build context |
| **Read-only filesystem** where possible (`--read-only`, `tmpfs` for `/tmp`) | Limits what an attacker can write |
| **Drop capabilities** (`--cap-drop=ALL`) and `no-new-privileges` | Least privilege at the kernel level |
| **Scan images** (`docker scout cves`, Trivy in CI) | Catch known vulnerabilities in base and deps |
| **Rebuild regularly** even without code changes | Pick up base-image security patches |
| **One process per container** | Clear blast radius; orchestrator handles restarts |
| **Health checks** | Unhealthy containers get replaced |
| **No `latest` tags** in deployments | Know exactly what runs |

## Runtime flags (Compose / K8s equivalents)

```yaml
services:
  api:
    image: app-api:sha-abc123
    read_only: true
    tmpfs: ["/tmp"]
    cap_drop: ["ALL"]
    security_opt: ["no-new-privileges:true"]
    user: "1000:1000"
```

Kubernetes: `securityContext.runAsNonRoot`, `readOnlyRootFilesystem`,
`allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`
([14-kubernetes/deployments.md](../14-kubernetes/deployments.md)).

## Supply chain

- Lockfile committed; `npm ci`.
- `npm audit --audit-level=high` in CI.
- Prefer official images; verify publisher for third-party ones.

## Related

- [15-security/secrets.md](../15-security/secrets.md)
- [image-optimization.md](image-optimization.md)
