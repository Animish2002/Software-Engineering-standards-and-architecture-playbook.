# Testing strategy

## The shape for this stack

```text
           ▲  few      E2E browser flows (optional): login, upload, share
          ▲▲▲          API tests over HTTP: every endpoint's contract, auth, permission, tenancy, error shape
        ▲▲▲▲▲          Integration: services + repositories against a real Postgres
      ▲▲▲▲▲▲▲▲  many   Unit: pure functions, validation schemas, service rules with repos mocked, hooks, components
```

For a JSON-API + SPA product, **API tests are the highest-value layer**:
they exercise routing, validation, auth, services, repositories, and the
database together, from the outside, and they double as the contract the
frontend relies on.

## What to mock, what not to

| Thing | Mock? | Why |
| --- | --- | --- |
| Database | **No** (integration/API). Yes only in pure-rule unit tests of a service | The query is the thing under test |
| Object storage (R2) | Yes: fake provider returning fake URLs | Network, cost, credentials |
| Email provider | Yes: capture buffer | Never send real mail from tests |
| Time | Yes (`vi.useFakeTimers`, injectable `now()`) | Determinism for expiry logic |
| Randomness (tokens) | Sometimes: inject a generator for assertions | Otherwise assert shape |
| Third-party HTTP (payments, Turnstile) | Yes: MSW/nock, or test keys where the provider offers always-pass ones | |
| Your own modules (other services) | Rarely; prefer real composition | Mocks drift from reality |
| The HTTP layer in frontend tests | Yes (MSW) | Tests components against the contract |
| shadcn/Radix components | No | Upstream tests them |

Rule: mock at the **boundary you'd replace in production** (network,
storage, mail, time). Don't mock the layer right below the one under
test unless it's a pure-rule unit test.

## What each layer must cover

| Layer | Must cover |
| --- | --- |
| Unit | Validation schemas (accept/reject), permission resolution, cursor encoding, quota math, path/tree helpers, formatters, upload orchestration, reducer/hook state machines |
| Integration | Repository queries with soft-delete filters, transactions (quota check + insert), recursive CTEs, unique-violation mapping |
| API | Per endpoint: happy path, validation 400s, 401, 403 (missing key), 404 (other tenant), envelope shape, pagination shape; auth flows (login/refresh/logout/reset); public share scoping; rate limiting disabled in test mode |
| E2E (optional) | The 3-5 flows that would lose money or data if broken |

## Test data

- Seed reference data (roles/permissions) with the real reconciling seed.
- Factories for entities (`createUser({ role: 'Employee' })`) that hit the real DB in integration/API tests.
- Each test creates what it needs with unique identifiers; no shared mutable fixtures.
- Reset between runs: truncate tables or run each file in a transaction rolled back at the end.

## CI

```text
lint → typecheck → unit (both apps) → integration + API (Postgres service container, API started with NODE_ENV=test) → build
```

Failing tests block merge. Flaky tests are fixed or deleted the week they
appear.

## Coverage

Track it; don't chase a number. 100% coverage of a controller that
re-shapes responses is worth less than one tenancy test. Aim for every
rule and every endpoint contract, not every line.

## Related

- [api-testing.md](api-testing.md)
- [00-engineering-principles/code-review-checklist.md](../00-engineering-principles/code-review-checklist.md)
