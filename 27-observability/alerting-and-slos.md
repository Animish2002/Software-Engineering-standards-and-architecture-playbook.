# Alerting and SLOs

## What is it?

Deciding what is worth interrupting a human for, and defining "working well
enough" precisely enough to argue with.

## Why does it matter?

Alerting fails in two directions and both end the same way. Too many alerts
and people mute the channel, so the real one is missed. Too few and you learn
about outages from a customer email. The target is a small number of alerts
that are almost always real.

## The rule

> **Alert on symptoms the user feels. Investigate causes with dashboards.**

CPU at 90% is not an alert — if latency and error rate are fine, the system
is doing its job efficiently. Error rate at 5% is an alert, whatever the CPU
is doing.

## The alerts worth having

Start with these five. Most products need nothing more for a long time.

| Alert | Condition | Severity |
| --- | --- | --- |
| **Service down** | Uptime check fails twice in a row (~2 min) | Page |
| **Error rate** | 5xx > 2% of requests over 5 min | Page |
| **Latency** | p95 > 2 s over 10 min | Ticket, page if sustained |
| **New exception type** | A new issue appears in the error tracker in production | Ticket |
| **Job dead-letter growth** | Dead-lettered jobs increase over 15 min | Ticket |

Then, as the product acquires them:

| Alert | Condition |
| --- | --- |
| DB connection pool saturated | `db_pool_waiting` > 0 for 5 min |
| Disk or storage quota | > 85% |
| Certificate expiry | < 14 days |
| Auth failure spike | Failed logins > 10× the weekly baseline |
| Business flatline | Zero signups or zero payments in a window where there are always some |
| Scheduled job did not run | No success heartbeat within its interval + grace |

That last pair catch the outages monitoring usually misses: everything is
"up", and nothing is working.

## Page vs ticket

| | Page (wake someone) | Ticket (next working day) |
| --- | --- | --- |
| Criterion | Users are affected **now** and a human can fix it **now** | Degraded, self-healing, or not urgent |
| Examples | Site down, error rate spike, payments failing | Slow query, rising memory, a new low-frequency exception |

If nobody would act at 3 a.m., it is not a page. Be strict: one unnecessary
page costs more than a day of a missed ticket, because it erodes trust in
every future alert.

## SLOs

An SLO is a target on a measurable indicator over a window. It exists to
convert "is this bad?" into arithmetic.

```text
SLI     proportion of requests that are successful and under 500 ms
SLO     99.5% over 30 days
Budget  0.5% of 30 days ≈ 3 h 39 m of failure allowed
```

| Service type | Reasonable starting SLO |
| --- | --- |
| Internal tool | 99% |
| Standard B2B SaaS | 99.5% |
| Revenue-critical path (checkout, login) | 99.9% |
| Anything claiming 99.99% | Needs multi-region, and a budget to match |

Do not set 99.99% because it looks good. Each nine multiplies the
engineering and on-call cost, and an SLO you routinely miss teaches everyone
to ignore it.

### Error budgets

The budget is the permitted failure. Spending it is normal — an unspent
budget means you are over-investing in reliability relative to features. What
matters is the response when it runs out:

- **Budget remaining:** ship features.
- **Budget exhausted:** reliability work takes priority until it recovers.

Written down in advance, this converts "should we fix this or ship that"
from an argument into a rule.

### Burn-rate alerting

Alerting on "SLO violated" is too late. Alert on the *rate* at which the
budget is being consumed:

| Burn rate | Meaning | Action |
| --- | --- | --- |
| 14.4× over 1 h | The 30-day budget is gone in ~2 days | Page |
| 6× over 6 h | Gone in ~5 days | Page |
| 1× over 3 days | On track to exhaust it exactly | Ticket |

Two windows — a fast one and a slow one — catch both sudden outages and slow
degradation, without firing on a brief blip.

## Runbooks

Every paging alert links to a runbook. It does not need to be long:

```markdown
# Alert: API error rate > 2%

## What it means
More than 2% of requests returned 5xx over 5 minutes. Users are seeing failures.

## Check, in order
1. Error tracker, last 30 min — one new issue, or many?
2. Did anything deploy in the last hour? (`/deploys`)
3. Database: connections, CPU, slow queries.
4. Provider status pages: storage, payments, auth.

## Common causes
- Bad deploy → roll back first, diagnose after.
- DB connection exhaustion → check pool metrics, look for a leaked transaction.
- Upstream provider outage → post status, wait, do not deploy.

## Escalate
#eng-oncall, then the service owner.
```

Written at 2 p.m., it is worth an hour at 3 a.m.

## Common mistakes

- Alerting on individual errors instead of rates.
- Alerting on CPU, memory, or disk I/O with no user-visible symptom.
- Thresholds set once and never revisited as traffic grows.
- No alert for "traffic dropped to zero", which looks healthy on every dashboard.
- Alerts routed to a channel nobody owns.
- SLOs with no consequence, so they are decoration.
- A paging alert with no runbook, so whoever is woken starts from nothing.

## Production considerations

- Route pages to a rotation (PagerDuty, Opsgenie, or the platform's), not an email address.
- External uptime checks must run outside your infrastructure. A monitor inside the cluster goes down with it.
- Test the alerting path end to end: silence a check deliberately and confirm someone's phone rings.
- Add maintenance windows for planned deploys so routine restarts do not page.
- Review the alerts that fired every month. Delete the ones that were never actionable.

## Checklist

- [ ] External uptime check with alerting, hosted outside your infrastructure.
- [ ] Alerts on error rate, latency, and service down.
- [ ] New-exception alerts from the error tracker.
- [ ] Job failure and dead-letter alerts.
- [ ] A "traffic is zero" alert.
- [ ] Every paging alert has a runbook link.
- [ ] Page vs ticket is decided per alert, and pages are rare.
- [ ] An SLO for the critical path, with a written error-budget policy.
- [ ] The paging path has been tested.
- [ ] Alerts reviewed monthly.

## Related

- [metrics.md](metrics.md)
- [error-tracking.md](error-tracking.md)
- [dashboards.md](dashboards.md)
