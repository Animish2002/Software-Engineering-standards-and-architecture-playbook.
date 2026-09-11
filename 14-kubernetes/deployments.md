# Deployments

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: app-prod
  labels: { app: api }
spec:
  replicas: 3
  revisionHistoryLimit: 5
  selector:
    matchLabels: { app: api }
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }       # never below capacity during rollout
  template:
    metadata:
      labels: { app: api }
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile: { type: RuntimeDefault }
      terminationGracePeriodSeconds: 30
      containers:
        - name: api
          image: ghcr.io/org/app-api:sha-abc1234            # immutable tag, never latest
          imagePullPolicy: IfNotPresent
          ports: [{ name: http, containerPort: 4000 }]
          env:
            - { name: NODE_ENV, value: production }
            - { name: PORT, value: "4000" }
            - { name: NODE_OPTIONS, value: "--max-old-space-size=384" }
          envFrom:
            - configMapRef: { name: api-config }
            - secretRef: { name: api-secrets }
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits: { memory: 512Mi }                        # memory limit; CPU limit optional (see resource-limits.md)
          startupProbe:
            httpGet: { path: /health, port: http }
            periodSeconds: 5
            failureThreshold: 12                             # up to 60 s to start
          readinessProbe:
            httpGet: { path: /health/ready, port: http }
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet: { path: /health, port: http }
            periodSeconds: 15
            failureThreshold: 3
          lifecycle:
            preStop:
              exec: { command: ["sh", "-c", "sleep 5"] }     # let endpoints propagate before SIGTERM
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
          volumeMounts:
            - { name: tmp, mountPath: /tmp }
      volumes:
        - { name: tmp, emptyDir: {} }
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector: { matchLabels: { app: api } }
```

## Notes

- **`maxUnavailable: 0`** keeps capacity during rollouts; needs headroom for one extra Pod.
- **Startup probe** protects slow starts from the liveness probe; **readiness** gates traffic; **liveness** restarts hung processes ([health-checks.md](health-checks.md)).
- **`preStop` sleep + graceful shutdown in the app** avoids dropped requests: Kubernetes removes the Pod from endpoints and sends `SIGTERM` concurrently; the sleep gives the endpoint change time to propagate.
- **`readOnlyRootFilesystem`** with an `emptyDir` for `/tmp`.
- **Spread across nodes** so one node failure doesn't take all replicas.
- **PodDisruptionBudget** (`minAvailable: 2`) for voluntary disruptions (node drains).

## Migrations

A `Job` run before the rollout (Helm `pre-upgrade` hook or a pipeline
step), same image, command `node packages/db/dist/scripts/migrate.js`.
Never in the container's startup on multi-replica Deployments.

## Related

- [health-checks.md](health-checks.md)
- [resource-limits.md](resource-limits.md)
- [13-docker/security.md](../13-docker/security.md)
