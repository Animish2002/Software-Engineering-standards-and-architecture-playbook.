# ConfigMaps

Non-secret configuration, injected as environment variables (preferred for
12-factor apps) or files.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: app-prod
data:
  LOG_LEVEL: info
  CORS_ORIGIN: https://app.example.com
  R2_BUCKET_NAME: app-files-prod
```

```yaml
# in the Deployment
envFrom:
  - configMapRef: { name: api-config }
```

## Rules

- Same variable names as `.env.example`; the app's `config.ts` validates them the same way.
- Changing a ConfigMap does **not** restart Pods. Either hash the ConfigMap into a Pod annotation (Helm `checksum/config`) so a change triggers a rollout, or use a tool (Reloader).
- Per-environment values live in the environment's overlay (Kustomize) or values file (Helm), not in separate hand-edited manifests.
- No secrets here, ever. `kubectl get configmap -o yaml` is readable by anyone with namespace read access.

## Related

- [secrets.md](secrets.md)
- [00-engineering-principles/configuration-management.md](../00-engineering-principles/configuration-management.md)
