# Resource requests and limits

## Definitions

- **Request**: what the scheduler reserves for the Pod on a node. Guaranteed.
- **Limit**: the ceiling. CPU over the limit is throttled; memory over the limit is OOM-killed.

## Recommendation for a Node API

```yaml
resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits:   { memory: 512Mi }
```

- **Memory: request ≈ typical usage, limit ≈ 2× with headroom**; set `--max-old-space-size` to ~75% of the limit so V8 GCs before the kernel kills it.
- **CPU: set a request, consider omitting the limit.** CPU limits cause throttling even when the node is idle, adding latency spikes (CFS quota). Many teams set requests only for latency-sensitive services; set a limit if the cluster is multi-tenant and noisy neighbours matter.
- Node is single-threaded; a request above `1000m` per Pod is wasted. Scale with replicas.

## QoS classes

| Class | Condition | Eviction priority |
| --- | --- | --- |
| Guaranteed | requests == limits for CPU and memory | Last |
| Burstable | requests < limits (or only some set) | Middle |
| BestEffort | Nothing set | First |

Always set at least requests; never ship BestEffort Pods to production.

## Sizing method

1. Run under realistic load; watch `kubectl top pod` and the metrics dashboard for p95 memory and CPU.
2. Set memory request at p50-p75, limit at ~1.5-2× p95.
3. Set CPU request at p75.
4. Revisit after a week of production metrics; VPA in recommendation mode can suggest values.

## Namespace guardrails

`LimitRange` (defaults for Pods that forget) and `ResourceQuota` (caps per
namespace) prevent one team from starving the cluster.

## Related

- [autoscaling.md](autoscaling.md)
- [06-nodejs/memory.md](../06-nodejs/memory.md)
