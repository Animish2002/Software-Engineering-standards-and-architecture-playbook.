# Rate limiting

## Why

Brute-force protection on auth, abuse protection on public endpoints, cost
protection on expensive ones, and fairness between tenants.

## What to limit, and how much

| Endpoint class | Key | Typical limit | Response |
| --- | --- | --- | --- |
| Login, password reset, signup | IP **and** email/account | 5-10 per 15 min | 429 + `Retry-After`; consider a bot challenge after N failures |
| Public/no-auth reads (`/shares/public/:token`) | IP | 60-120 per min | 429 |
| Authenticated API (general) | User id | 600-1200 per min | 429 |
| Expensive operations (exports, batch presign) | User id | 10-30 per min | 429 |
| Webhook receivers | Source IP/signature | High; drop on failure | 429 |

Start loose and tighten from logs; a false positive locks out a real user.

## Headers

```text
RateLimit-Limit: 600
RateLimit-Remaining: 597
RateLimit-Reset: 42          (seconds until window reset)
Retry-After: 42              (on 429)
```

## Implementation

| Runtime | Store | Library |
| --- | --- | --- |
| Single Node instance | In-memory | `express-rate-limit` (Express), `hono-rate-limiter` |
| Multiple Node instances | Redis/Postgres store | Same libraries with a store adapter |
| Cloudflare Workers | Workers Rate Limiting binding, or Cloudflare WAF rate-limiting rules in front | Prefer the platform feature; it runs before your code |
| Any | Platform/WAF edge rules | Cheapest; use for IP-level protection |

```ts
// Express
import rateLimit from 'express-rate-limit';
app.set('trust proxy', 1);   // so req.ip is the client, not the load balancer
export const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => config.NODE_ENV === 'test' });
router.post('/login', authLimiter, controller.login);
```

Disable in `NODE_ENV=test` (the API test suite deliberately storms
401/403s), never in production.

## Rules

- Key auth limits by **both** IP and account; attackers rotate IPs, victims share NATs.
- Return 429 with the standard envelope and `RATE_LIMITED` code.
- Don't rate-limit health checks.
- Log 429s with the key so abuse is visible.
- Behind a proxy, set `trust proxy` correctly or every user shares the proxy's IP.

## Related

- [api-security.md](api-security.md)
- [15-security/authentication.md](../15-security/authentication.md)
