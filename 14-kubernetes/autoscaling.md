# Autoscaling

## Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api, namespace: app-prod }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
  behavior:
    scaleDown: { stabilizationWindowSeconds: 300 }
    scaleUp:   { stabilizationWindowSeconds: 0, policies: [{ type: Percent, value: 100, periodSeconds: 60 }] }
```

- Needs `metrics-server` and CPU **requests** set (utilisation is relative to requests).
- `minReplicas: 2` for availability; scale-down stabilisation avoids flapping.
- Custom metrics (requests per second, queue depth) via Prometheus Adapter or KEDA when CPU isn't the right signal (I/O-bound Node APIs often saturate the DB before CPU).

## What autoscaling can't fix

- A slow database. More API Pods = more connections = worse. Fix queries and indexes first; size the pool per Pod so `replicas × pool ≤ max_connections`.
- Blocked event loops. Profile first ([06-nodejs/event-loop.md](../06-nodejs/event-loop.md)).
- Memory leaks. Restarts mask them; find them ([06-nodejs/memory.md](../06-nodejs/memory.md)).

## Cluster autoscaling

Node pools scale via the cloud's cluster autoscaler when Pods are
unschedulable. Set node pool min/max; prefer smaller nodes for finer
scaling. Karpenter on EKS for smarter provisioning.

## Vertical Pod Autoscaler

Use in **recommendation mode** to learn right-sized requests. Auto mode
restarts Pods to resize; avoid on latency-sensitive services.

## Scaling to zero

Not with HPA (min 1). If idle scale-to-zero matters, Knative/KEDA or,
more simply, a platform like Cloudflare Workers ([23-decision-guides/deployment.md](../23-decision-guides/deployment.md)).

## Related

- [resource-limits.md](resource-limits.md)
- [03-databases/connection-pooling.md](../03-databases/connection-pooling.md)
