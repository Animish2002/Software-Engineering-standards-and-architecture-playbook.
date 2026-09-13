# Frontend monitoring

## What is it?

Observability for the half of the system running on someone else's device:
JavaScript errors, real-user performance, and API calls as the browser
experienced them.

## Why does it matter?

Server metrics can be perfect while the application is unusable. A bundle
that fails to parse on an older browser, a Safari-only crash, a third-party
script blocking render — all of these are invisible from the backend, where
every request returned 200.

## What to collect

| Signal | Why | Tool |
| --- | --- | --- |
| **Unhandled errors and rejections** | The frontend equivalent of a 500 | Sentry Browser SDK |
| **Core Web Vitals** (LCP, INP, CLS) | What "slow" means to a real user on a real device | `web-vitals` |
| **Failed API calls** | The client's view, including the ones that never reached your server | Your API client |
| **Route changes** | Context for the above; which screen was involved | Router integration |

Note the third row. A request that fails at DNS, times out, or is blocked by
an extension produces no server-side log at all. Only the client knows.

## Recommended approach

### Errors

```ts
// main.tsx — before the app renders
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_GIT_SHA,       // must match the uploaded source maps
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,                 // see the privacy note below
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',       // benign, extremely noisy
    /^Non-Error promise rejection captured/,
    'Failed to fetch',                          // usually the user's network, not your bug
  ],
  denyUrls: [/extensions\//, /^chrome-extension:\/\//],
});
```

`denyUrls` matters more than it looks. Without it, a large share of your
frontend "errors" come from browser extensions injecting scripts into pages
you do not control.

Pair it with an error boundary so a render crash shows a recovery path rather
than a blank page ([10-frontend/error-and-loading-states.md](../10-frontend/error-and-loading-states.md)).

### Web Vitals

```ts
// observability/vitals.ts
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals';

function report({ name, value, rating, id }: Metric) {
  navigator.sendBeacon?.('/api/vitals', JSON.stringify({
    name, value: Math.round(value), rating, id, path: location.pathname,
  }));
}

[onLCP, onINP, onCLS, onTTFB].forEach((fn) => fn(report));
```

`sendBeacon` rather than `fetch`: the metrics are finalised as the page is
being unloaded, which is exactly when a normal request gets cancelled.

| Metric | Good | Measures |
| --- | --- | --- |
| **LCP** | < 2.5 s | When the main content appeared |
| **INP** | < 200 ms | Responsiveness to interaction |
| **CLS** | < 0.1 | Visual stability |
| **TTFB** | < 800 ms | Server and network, before the frontend is involved |

Track the **p75** across real users, not your laptop's score. Lab numbers
from a fast machine on a fast network are not what your users have
([17-performance/frontend.md](../17-performance/frontend.md)).

### API failures, with correlation

```ts
// api/client.ts
if (!response.ok || error) {
  Sentry.captureMessage('api.request_failed', {
    level: 'warning',
    tags: {
      endpoint: route,                                    // the pattern, not the URL
      status: response?.status ?? 'network_error',
      request_id: response?.headers.get('X-Request-Id'),  // the link to the server logs
    },
  });
}
```

Capturing `X-Request-Id` from the response is what makes a user's bug report
solvable: one id, and you have the server-side logs for that exact request
([05-apis/observability.md](../05-apis/observability.md)).

## Privacy

The browser SDK captures more than you expect, and it leaves your
infrastructure.

- **Scrub inputs.** Passwords, payment fields, and personal data appear in breadcrumbs and DOM snapshots.
- **Session replay is a privacy decision, not a feature toggle.** If you enable it, mask all text and inputs by default and unmask deliberately. Check it against your privacy policy first.
- **User context: the id only.** Same rule as the backend ([error-tracking.md](error-tracking.md)).
- **Do not log URLs containing tokens** — password reset links, magic links, OAuth callbacks.

## Source maps

```bash
# CI, after the production build
sentry-cli sourcemaps upload --release "$GIT_SHA" ./dist/assets
```

Without them every stack trace is `main-4f3a1b.js:1:48210`. Upload them to
the error tracker; do not deploy them to the public origin, where they hand
your source to anyone who asks.

## Common mistakes

- No `denyUrls`, so extension noise drowns real errors.
- Reporting Web Vitals with `fetch` and losing them on unload.
- Measuring performance only in the lab.
- Session replay enabled without masking.
- Source maps not uploaded, or uploaded under a release that does not match the deployed build.
- Not capturing `X-Request-Id`, leaving frontend and backend evidence unlinkable.
- Treating every "Failed to fetch" as a bug. Some proportion is users on trains.

## Production considerations

- Sample vitals if traffic is high; errors should not be sampled until volume forces it.
- Segment vitals by route and device class. A single site-wide LCP hides the one slow page.
- Alert on a spike in frontend errors after a deploy — it is often the first sign of a bad release.
- Budget the third-party SDK's own bundle size; it is not free, and it loads on every page.

## Checklist

- [ ] Error tracking initialised with environment and release.
- [ ] `denyUrls` and `ignoreErrors` tuned for extension and network noise.
- [ ] Error boundary with a recovery path.
- [ ] Core Web Vitals reported via `sendBeacon`, tracked at p75 by route.
- [ ] Failed API calls captured with the endpoint pattern and `X-Request-Id`.
- [ ] Inputs scrubbed; session replay off or fully masked.
- [ ] Source maps uploaded in CI, not served publicly.
- [ ] Frontend error spike after deploy is alerted on.

## Related

- [error-tracking.md](error-tracking.md)
- [10-frontend/performance.md](../10-frontend/performance.md)
- [17-performance/frontend.md](../17-performance/frontend.md)
