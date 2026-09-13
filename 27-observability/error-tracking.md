# Error tracking

## What is it?

A service that receives every unhandled exception with its stack trace,
groups identical errors together, and tells you how often each one happens,
to how many users, and since which release.

## Why does it matter?

`logger.error(err)` puts the stack in a log stream where nobody is looking.
Error tracking turns that into "this started 20 minutes ago, affects 340
users, began with release `a1b2c3`" — which is diagnosis rather than
evidence. It is the highest value-per-hour item in this whole section, and
it takes about twenty minutes to set up.

## When should I NOT use it?

Never skip it for a production web application. For a CLI or an internal
script, structured logs with stack traces are enough.

## Recommended approach

Sentry is the default (self-hostable if data residency requires it). GlitchTip
is a lighter open-source alternative that speaks the same protocol.

```ts
// observability/errors.ts — imported first, before anything else
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: config.SENTRY_DSN,
  environment: config.NODE_ENV,
  release: config.GIT_SHA,                    // injected at build time
  tracesSampleRate: 0,                        // traces are a separate decision: tracing.md
  ignoreErrors: ['ECONNRESET', 'EPIPE'],
  beforeSend(event) {
    if (config.NODE_ENV !== 'production') return null;
    return scrub(event);                      // see below
  },
});
```

### Report the unexpected, not the expected

```ts
// error middleware — the only place that decides
app.use((err, req, res, _next) => {
  const status = err instanceof AppError ? err.status : 500;

  if (status >= 500) {
    Sentry.withScope((scope) => {
      scope.setUser({ id: req.user?.id });          // id only
      scope.setTag('route', req.route?.path ?? 'unmatched');
      scope.setTag('request_id', req.id);           // ties the error to the logs
      Sentry.captureException(err);
    });
    req.log.error({ err }, 'request.failed');
  } else {
    req.log.info({ code: err.code, status }, 'request.rejected');
  }

  res.status(status).json(toErrorResponse(err));
});
```

A 400 from validation and a 404 from a missing record are the application
working correctly. Sending them to the error tracker buries the real
exceptions under thousands of events, and everyone stops reading the alerts.
This is the mistake that kills error tracking as a practice.

Capture in workers too — a job that throws is invisible otherwise:

```ts
await handler(job).catch((err) => {
  Sentry.withScope((scope) => {
    scope.setTag('job_type', job.type);
    scope.setContext('job', { id: job.id, attempt: job.attempt });
    Sentry.captureException(err);
  });
  throw err;                                  // let the queue handle retry/dead-letter
});
```

### Scrub before sending

Error events carry request data, and request data carries secrets.

```ts
function scrub(event: Sentry.ErrorEvent) {
  const headers = event.request?.headers;
  if (headers) for (const h of ['authorization', 'cookie', 'x-api-key']) delete headers[h];
  if (event.request?.data) event.request.data = '[redacted]';     // bodies contain passwords
  if (event.request?.query_string) event.request.query_string = '[redacted]';  // and OAuth codes
  return event;
}
```

Send the user's **id**, never their email, name, or IP unless you have decided
that is acceptable and said so in your privacy policy. The id is enough to
find them; the rest is a GDPR question you did not need to have.

### Releases and source maps

```bash
# in CI, after the build
sentry-cli releases new "$GIT_SHA"
sentry-cli sourcemaps upload --release "$GIT_SHA" ./dist
sentry-cli releases finalize "$GIT_SHA"
```

Without source maps a minified frontend stack trace is unreadable. With a
release attached, "regressed in this deploy" becomes a fact rather than a
guess — and that single link between deploy and error is most of the value.
Upload the maps; do not serve them publicly.

### Grouping

The tracker groups by stack fingerprint. Two habits keep grouping useful:

- **Static error messages, dynamic context.** `new Error(\`User ${id} not found\`)` creates one group per user. Use `new Error('User not found')` with `scope.setContext('user', { id })`.
- **Custom fingerprints** where the default is wrong, for example collapsing every timeout from one dependency into one issue.

## Bad example

```ts
// Avoid
app.use((err, req, res, next) => {
  Sentry.captureException(err);                     // every 404 and validation failure
  res.status(500).json({ error: err.message });     // internals leaked to the client
});
```

Within a week the tracker is 95% noise, the team has muted the alerts, and
the one real exception is unfindable.

## Common mistakes

- Capturing 4xx as exceptions.
- Dynamic strings in error messages, splitting one issue into thousands.
- Not scrubbing headers and bodies, so tokens end up in a third-party service.
- Sending full PII when the user id would do.
- No release tagging, so nobody can connect an error spike to a deploy.
- No source maps, so frontend stacks are unreadable.
- Initialising Sentry after other imports, missing early startup failures.
- Instrumenting the API but not the background workers.

## Production considerations

- Alert on *new* issues and on issue *regressions*, not on every event ([alerting-and-slos.md](alerting-and-slos.md)).
- Set a sample rate if volume is high, but never sample new issue types out of existence.
- Triage weekly: resolve, ignore, or fix. An error tracker with 400 unresolved issues is a log file with a nicer font.
- Keep the DSN in config; it is not a secret in the browser build, but the auth token used by `sentry-cli` in CI absolutely is.
- Frontend setup differs — see [frontend-monitoring.md](frontend-monitoring.md).

## Checklist

- [ ] Initialised before other imports, with `environment` and `release`.
- [ ] Only 5xx and unhandled exceptions are captured.
- [ ] Request id attached as a tag, tying errors to logs.
- [ ] Headers, bodies, and query strings scrubbed.
- [ ] User context is the id only.
- [ ] Source maps uploaded in CI, not served publicly.
- [ ] Background jobs report too.
- [ ] Alerts on new and regressed issues; a weekly triage habit.

## Related

- [00-engineering-principles/error-handling.md](../00-engineering-principles/error-handling.md)
- [alerting-and-slos.md](alerting-and-slos.md)
- [frontend-monitoring.md](frontend-monitoring.md)
