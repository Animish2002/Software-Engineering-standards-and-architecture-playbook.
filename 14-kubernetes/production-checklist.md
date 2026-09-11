# Kubernetes production checklist

Only after [architecture.md](architecture.md) said "yes, Kubernetes".

- [ ] Managed control plane; cluster version within support.
- [ ] Namespaces per environment (or per cluster); RBAC least privilege; no cluster-admin for CI.
- [ ] GitOps (Argo CD/Flux) or a pipeline; no `kubectl apply` from laptops.
- [ ] Images tagged by SHA; pulled from a private registry with scanning.
- [ ] Deployment: ≥ 2 replicas, `maxUnavailable: 0`, topology spread, PodDisruptionBudget.
- [ ] Probes: startup, readiness (with 503 on shutdown), liveness (no dependency checks).
- [ ] `preStop` sleep + app graceful shutdown; `terminationGracePeriodSeconds` sized.
- [ ] Requests set; memory limit set; `--max-old-space-size` matched.
- [ ] `securityContext`: non-root, read-only FS, no privilege escalation, drop ALL caps, seccomp.
- [ ] ConfigMap for config; secrets from an external store; etcd encryption on.
- [ ] Ingress with TLS (cert-manager); body size/timeouts mirror the app; Cloudflare in front.
- [ ] NetworkPolicy: default deny; allow ingress → api, api → database egress.
- [ ] HPA with sane min/max; DB pool sized for max replicas.
- [ ] Migrations as a Job before rollout.
- [ ] Logs shipped (stdout → collector); metrics + alerts on 5xx rate, p95, restarts, OOMKills.
- [ ] Backups for anything stateful in-cluster (ideally nothing; managed DB outside).
- [ ] A runbook: how to roll back (`kubectl rollout undo` / Git revert), how to scale, how to read logs.

## Related

- [21-checklists/production-checklist.md](../21-checklists/production-checklist.md)
- [13-docker/production-checklist.md](../13-docker/production-checklist.md)
