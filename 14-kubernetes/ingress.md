# Ingress

Routes external HTTP(S) to Services. Needs an ingress controller
(ingress-nginx, the cloud's, or Traefik) and, for TLS, cert-manager or a
cloud-managed certificate. Newer clusters may use the **Gateway API**
instead; same concepts.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  namespace: app-prod
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: 2m          # matches the API's body limit; uploads go to object storage anyway
    nginx.ingress.kubernetes.io/proxy-read-timeout: "30"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service: { name: api, port: { name: http } }
```

## Rules

- TLS terminated at the ingress; the app sees plain HTTP and reads `X-Forwarded-Proto` (`trust proxy` set to the ingress hop count).
- Body size and timeouts at the ingress mirror the app's limits.
- One host per app; path-based routing only when services genuinely share a host.
- Put Cloudflare (proxy + WAF + rate limiting) in front of the ingress's load balancer; restrict the LB to Cloudflare IPs if possible.
- Keep the SPA off the cluster (Pages/CDN); the cluster serves the API.

## Related

- [services.md](services.md)
- [09-cloudflare/security.md](../09-cloudflare/security.md)
