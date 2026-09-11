# Kubernetes: when and how

## When Kubernetes is unnecessary

- One to three services and a database. A platform (Railway, Fly, Render) or a VM with Docker Compose runs this with a fraction of the operational load.
- No one on the team wants to own cluster upgrades, node pools, ingress controllers, cert renewal, and network policies.
- Traffic that a couple of instances behind a load balancer can serve.
- "We might need to scale." Platforms scale horizontally too.

The cost of Kubernetes is not the YAML; it's the ongoing operation of a
distributed system beneath your distributed system.

## When it is appropriate

- Many services (10+) from multiple teams needing a uniform deploy/observe/scale substrate.
- Requirements a platform can't express: custom networking, GPU scheduling, sidecars, strict multi-tenant isolation, on-prem or air-gapped.
- Existing organisational investment (a platform team already runs a cluster).
- Batch/ML workloads with bursty scheduling needs.

If you do use it: **managed** control plane (GKE, EKS, AKS), one cluster
per environment or namespaces with strict policies, and a GitOps flow.

## Core objects

| Object | What it is | Analogy |
| --- | --- | --- |
| **Pod** | One or more containers sharing network/storage; the unit of scheduling | A running container (usually one) |
| **Deployment** | Desired number of identical Pods + rolling update strategy | "Run 3 copies of the API, replace them one at a time on change" |
| **ReplicaSet** | Managed by Deployment; keeps N Pods alive | Internal |
| **Service** | Stable virtual IP/DNS for a set of Pods | Internal load balancer |
| **Ingress** | HTTP(S) routing from outside to Services | Reverse proxy config |
| **ConfigMap** | Non-secret configuration | Env file |
| **Secret** | Base64 config (not encrypted by default) | Env file with secrets; needs an external secret store |
| **Namespace** | Logical partition | Environment or team boundary |
| **HorizontalPodAutoscaler** | Scales a Deployment on metrics | Autoscaling rule |
| **Job / CronJob** | Run-to-completion Pods | Migrations, scheduled tasks |
| **PersistentVolumeClaim** | Storage request | Disk (avoid for stateless apps; use managed DB/object storage) |

## Reference shape for a Node API

```text
Namespace: app-prod
├── Deployment api (3 replicas, image app-api:sha, probes, limits, non-root)
├── Service api (ClusterIP :80 → 4000)
├── Ingress api.example.com → Service api (TLS via cert-manager)
├── ConfigMap api-config (LOG_LEVEL, CORS_ORIGIN)
├── ExternalSecret api-secrets → Secret (DATABASE_URL, JWT_SECRET) from a vault
├── Job api-migrate (runs before rollout; Helm hook or pipeline step)
└── HPA api (2-10 replicas on CPU 70%)
Database: managed Postgres outside the cluster.
```

## Tooling

- **Helm** or **Kustomize** for templating per environment; pick one.
- **GitOps** (Argo CD / Flux): the cluster pulls manifests from Git; no `kubectl apply` from laptops.
- **cert-manager** for TLS; **ingress-nginx** or the cloud's ingress.
- **Metrics server** (for HPA), Prometheus/Grafana or the cloud's monitoring.

## Related

- [23-decision-guides/deployment.md](../23-decision-guides/deployment.md)
- [deployments.md](deployments.md)
