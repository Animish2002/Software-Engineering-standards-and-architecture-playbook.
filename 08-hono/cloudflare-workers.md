# Hono on Cloudflare Workers

Platform detail is in [09-cloudflare/](../09-cloudflare/README.md). This
page is what changes for the Hono app itself.

## Constraints to design around

| Constraint | Consequence |
| --- | --- |
| No long-lived process | No module-level pools/timers/caches that assume persistence; per-request or per-isolate memoisation only |
| CPU time limit per request (ms-level on free/paid tiers; see docs) | Keep request work I/O-bound; heavy CPU (bcrypt cost 12, big JSON) is a problem: use `PBKDF2`/`scrypt` via Web Crypto with tuned params, or Argon2 WASM, and measure |
| Web-standard APIs only (+ `nodejs_compat` polyfills) | Prefer `fetch`, Web Crypto, Web Streams; check each npm package for Node-only APIs |
| Bundle size limits | Tree-shake; avoid huge SDKs (use `aws4fetch` instead of the full S3 SDK for presigning) |
| Eventual consistency in KV | Don't use KV for anything read-after-write |
| Background work must be `ctx.waitUntil(promise)` | Fire-and-forget without `waitUntil` is cancelled when the response ends |

```ts
app.post('/users', async (c) => {
  const user = await users.create(c.env, input);
  c.executionCtx.waitUntil(sendWelcomeEmail(c.env, user).catch((err) => log.warn({ err }, 'email failed')));
  return c.json(ok(user), 201);
});
```

## Local development

```bash
npx wrangler dev            # runs the Worker locally with local bindings (Miniflare); .dev.vars for secrets
npx wrangler dev --remote   # against real bindings
npx wrangler tail           # live production logs
```

## Deployment

```bash
npx wrangler deploy                      # production
npx wrangler deploy --env staging        # with [env.staging] in wrangler config
```

CI: [18-devops/ci-cd.md](../18-devops/ci-cd.md) (Workers variant). Secrets
via `wrangler secret put` or the dashboard; never in `vars`.

## Testing

`@cloudflare/vitest-pool-workers` runs Vitest inside the Workers runtime
with bindings; or test the Hono app directly with `app.request('/path', init, env)` for unit-level tests.

```ts
const res = await app.request('/health', {}, env);
expect(res.status).toBe(200);
```

## Related

- [09-cloudflare/workers.md](../09-cloudflare/workers.md)
- [09-cloudflare/deployment.md](../09-cloudflare/deployment.md)
