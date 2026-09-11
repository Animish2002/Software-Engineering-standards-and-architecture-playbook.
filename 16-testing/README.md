# 16 — Testing

What to test, at which level, with which tools, so that tests catch real
regressions without becoming a maintenance burden.

| Document | Answers |
| --- | --- |
| [testing-strategy.md](testing-strategy.md) | The pyramid for this stack; what to mock and what not to. |
| [unit-testing.md](unit-testing.md) | Vitest for pure logic and services. |
| [integration-testing.md](integration-testing.md) | Services + real database. |
| [api-testing.md](api-testing.md) | Black-box HTTP tests against a running API: contracts, auth, tenancy, latency. |
| [database-testing.md](database-testing.md) | Test databases, fixtures, migrations in CI. |
| [frontend-testing.md](frontend-testing.md) | Vitest + Testing Library + MSW; what's worth it. |

Checklists: part of [21-checklists/backend-checklist.md](../21-checklists/backend-checklist.md) and [frontend-checklist.md](../21-checklists/frontend-checklist.md).

## Tools (supporting tier)

| Tool | Use |
| --- | --- |
| **Vitest** | Unit + integration for both apps; same config style as Vite |
| **Playwright `request`** | API tests over HTTP (no browser) |
| **@testing-library/react** + **user-event** | Component behaviour |
| **MSW** | Network-level API mocking in frontend tests |
| **Docker Postgres** (local + CI service container) | Real database for integration/API tests |
| Playwright browser E2E | Optional tier; a handful of critical flows only |
