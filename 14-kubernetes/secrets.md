# Secrets in Kubernetes

## The problem with plain `Secret`

A Kubernetes `Secret` is base64-encoded, **not encrypted**, stored in
etcd, and readable by anyone with `get secrets` in the namespace. Enable
etcd encryption at rest, restrict RBAC, and don't commit Secret manifests
with real values to Git.

## Recommended: external secret store

| Option | How |
| --- | --- |
| **External Secrets Operator** | `ExternalSecret` objects sync from AWS Secrets Manager / GCP Secret Manager / Vault / 1Password into Kubernetes Secrets |
| Cloud CSI secret driver | Mount secrets as files directly from the cloud store |
| Sealed Secrets | Encrypt Secret manifests so they *can* be committed; the controller decrypts in-cluster. Good for GitOps without a cloud store |
| SOPS + age/KMS | Encrypt values files; decrypt in the pipeline |

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: api-secrets, namespace: app-prod }
spec:
  refreshInterval: 1h
  secretStoreRef: { name: aws-secrets, kind: ClusterSecretStore }
  target: { name: api-secrets }
  data:
    - { secretKey: DATABASE_URL, remoteRef: { key: app/prod/api, property: DATABASE_URL } }
    - { secretKey: JWT_SECRET, remoteRef: { key: app/prod/api, property: JWT_SECRET } }
```

```yaml
# Deployment
envFrom:
  - secretRef: { name: api-secrets }
```

## Rules

- Secrets as env vars (simplest) or files (rotatable without restart if the app re-reads; most Node apps don't, so plan a rollout on rotation).
- RBAC: only the Deployment's ServiceAccount and the operators need to read them.
- Rotate on a schedule and immediately on suspicion; the app must read config at boot only, so rotation = rollout.
- Never `kubectl create secret --from-literal` from a laptop in production; it bypasses the audit trail.
- Never log env at startup beyond non-secret names.

## Related

- [15-security/secrets.md](../15-security/secrets.md)
- [configmaps.md](configmaps.md)
