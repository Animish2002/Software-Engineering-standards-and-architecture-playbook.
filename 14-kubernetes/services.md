# Services

A Service gives a stable name and virtual IP to the Pods matching a
selector, load-balancing across them.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: app-prod
spec:
  type: ClusterIP
  selector: { app: api }
  ports:
    - { name: http, port: 80, targetPort: http }
```

| Type | Reachable from | Use |
| --- | --- | --- |
| **ClusterIP** (default) | Inside the cluster (`api.app-prod.svc.cluster.local`) | Everything; expose to the internet through an Ingress |
| NodePort | Every node's IP on a high port | Rarely; debugging or bare-metal without a LB |
| LoadBalancer | Cloud load balancer per Service | One-off TCP services (not HTTP; use Ingress for HTTP to avoid a LB per service) |
| ExternalName | DNS alias to an external host | Pointing at a managed database by a stable in-cluster name |
| Headless (`clusterIP: None`) | Direct Pod IPs via DNS | StatefulSets, client-side balancing |

## Rules

- HTTP services are `ClusterIP` + Ingress.
- Ports named (`http`) so probes and Ingress reference the name.
- Readiness probes decide membership: a Pod failing readiness is removed from the Service endpoints, which is how graceful rollouts work.
- Session affinity off (stateless app); if you need it, you have state to move to the database.

## Related

- [ingress.md](ingress.md)
- [health-checks.md](health-checks.md)
