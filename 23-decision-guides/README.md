# 23 — Decision guides

Each page is one recurring decision, answered as a short tree plus a
table of the real trade-offs. Use these to make a call quickly, then link
to the fuller document for the reasoning.

| Guide | Decision |
| --- | --- |
| [architecture.md](architecture.md) | Monolith vs modular monolith vs microservices |
| [backend-runtime.md](backend-runtime.md) | Node+Express vs Hono vs Cloudflare Workers |
| [databases.md](databases.md) | PostgreSQL vs MySQL; SQL vs ORM; offset vs cursor pagination; Redis vs DB caching; when to add an index |
| [deployment.md](deployment.md) | Docker vs no Docker; Kubernetes vs simpler deployment |
| [frontend.md](frontend.md) | Local vs global state; Context vs external store; component vs hook; REST vs alternatives |
| [code-organization.md](code-organization.md) | Utility function vs service; service vs repository; when to introduce abstraction |

Each tree assumes the defaults stated throughout this playbook (monolith,
Postgres, Node/Hono, keyset pagination for big lists) and only asks you to
deviate when a real signal justifies it.
