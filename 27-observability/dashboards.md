# Dashboards

## What is it?

The small number of saved views you actually open: one during an incident,
one to see whether a deploy went well, one to see whether the product is
working.

## Why does it matter?

Dashboards fail by proliferating. A folder of forty auto-generated panels is
where nobody looks during an outage, because finding the relevant graph takes
longer than reading the logs. Three good dashboards beat forty complete ones.

## The three

### 1. Service health — the incident dashboard

Opened when an alert fires. It must answer "what is broken and since when" in
under thirty seconds, so it goes on one screen with no scrolling.

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Requests/min │ Error rate % │ p95 latency  │ Uptime 24 h  │
├──────────────┴──────────────┴──────────────┴──────────────┤
│ Error rate over time, with deploy markers                 │
├───────────────────────────────────────────────────────────┤
│ p50 / p95 / p99 latency over time                         │
├────────────────────────────┬──────────────────────────────┤
│ Top 5 routes by error count│ Top 5 routes by p95          │
├────────────────────────────┴──────────────────────────────┤
│ DB pool in use / waiting  │ Event loop lag │ Memory       │
└───────────────────────────────────────────────────────────┘
```

**Deploy markers are the highest-value element on this page.** Most incidents
correlate with a deploy, and an annotated line turns a ten-minute
investigation into a glance.

### 2. Release health — the "did that deploy work" dashboard

Opened after every deploy, compared against the hour before:

- Error rate, now vs the previous release.
- p95 latency, now vs the previous release.
- New issues in the error tracker since this release.
- Throughput, to confirm traffic is actually reaching the new version.

### 3. Product health — the "is the product working" dashboard

Reviewed weekly. Catches the failures where the infrastructure is perfectly
healthy and the product is broken:

- Signups, logins (by success/failure), and password resets per hour.
- The core action of your product — uploads completed, orders placed, courses started.
- Background job throughput and failure rate by type.
- Storage growth and any quota approaching a limit.

A signup rate of zero for two hours on a Tuesday is an outage that no
infrastructure alert will ever catch.

## Design rules

| Rule | Reason |
| --- | --- |
| One screen, no scrolling, most important at the top left | Where eyes land first |
| Big numbers for the four things you check first | Readable from across a room |
| Time-series below the numbers, sharing one time range | Comparison requires alignment |
| Deploy annotations on every time-series | Correlation for free |
| Percentiles, never means | The mean hides the tail |
| Absolute time, UTC, on shared links | "2 hours ago" is meaningless in a pasted screenshot |
| Every panel has a threshold line where one exists | Turns a number into a judgement |
| A panel nobody has looked at in a month gets deleted | Dashboards decay like code |

## Bad example

A dashboard with thirty panels of raw counters, no error rate, means instead
of percentiles, no deploy markers, and a default range of 30 days — so the
five-minute outage you are investigating is one pixel wide.

## Common mistakes

- Auto-generated dashboards nobody has curated. They cover everything and show nothing.
- Graphing counters instead of rates, so every deploy looks like a cliff.
- No deploy annotations.
- Mixing environments on one panel.
- Dashboards that only exist in one person's saved views.
- Treating dashboards as a substitute for alerting. Nobody is watching at 3 a.m.

## Production considerations

- Keep dashboard definitions in the repository as JSON or Terraform, reviewed like code. A dashboard that exists only in a UI is lost with the account.
- Link the runbook from each alert directly to the relevant dashboard with the time range pre-set.
- Grant read-only dashboard access widely. Support answering "is it slow for everyone?" without asking an engineer is a real saving.
- If the platform provides these views already, use them. Rebuilding Railway's or Cloudflare's metrics in Grafana buys nothing until you need to combine sources.

## Checklist

- [ ] A one-screen service health dashboard, linked from every paging alert.
- [ ] Deploy markers on the time-series panels.
- [ ] A release health view compared against the previous release.
- [ ] A product health view with the core business events.
- [ ] Percentiles, not means.
- [ ] Definitions stored in the repository.
- [ ] Unused panels deleted.

## Related

- [metrics.md](metrics.md)
- [alerting-and-slos.md](alerting-and-slos.md)
- [18-devops/ci-cd.md](../18-devops/ci-cd.md)
