# 14 — Kubernetes

Read [architecture.md](architecture.md) first: it says when Kubernetes is
the wrong tool, which for most projects in this playbook it is. The rest
of the section is for when it isn't.

| Document | Answers |
| --- | --- |
| [architecture.md](architecture.md) | When to use it, when not to; the core objects and how they fit. |
| [deployments.md](deployments.md) | A production Deployment manifest for a Node API. |
| [services.md](services.md) | ClusterIP/NodePort/LoadBalancer; exposing the API internally. |
| [ingress.md](ingress.md) | HTTP routing and TLS into the cluster. |
| [configmaps.md](configmaps.md) | Non-secret config. |
| [secrets.md](secrets.md) | Secrets, and why plain Secrets aren't enough. |
| [health-checks.md](health-checks.md) | Liveness, readiness, startup probes. |
| [resource-limits.md](resource-limits.md) | Requests, limits, QoS, and Node memory. |
| [autoscaling.md](autoscaling.md) | HPA on CPU/requests; what it can't fix. |
| [production-checklist.md](production-checklist.md) | Pre-ship list. |

## Short version

```text
Do you have several services, an ops-capable team, and needs a platform can't meet
(custom networking, GPU scheduling, multi-tenant isolation, on-prem)?
  ├── No  → Railway / Fly / Render / Cloudflare / a VM with Compose.  Stop here.
  └── Yes → Managed Kubernetes (GKE/EKS/AKS), never self-managed control planes.
```
