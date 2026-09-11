# Choosing an architecture

One page. The detailed reasoning is in the sibling documents; the decision
trees are in [23-decision-guides/architecture.md](../23-decision-guides/architecture.md).

## Deployment shape

```text
How many teams release independently?
├── One team ──────────────────────────────► Monolith (one repo, apps/web + apps/api + packages)
└── Several, and coordination is a measured cost
        │
        ▼
    Is there a module with a proven, different scaling/runtime profile?
    ├── No  ─────────────────────────────► Modular monolith
    └── Yes ─────────────────────────────► Modular monolith + extract that one module
```

## Internal structure

```text
How many features (business concepts)?
├── 1-3  ──► Flat: routes/, services/, one folder each; layers inside
└── 4+   ──► Feature folders (modules/<feature>/), layers inside, index.ts per module
                 │
                 ▼
             3+ contributors or boundaries being crossed?
             └── Yes ──► Enforce with lint (modular monolith)
```

## Ports and adapters

```text
Is there a second implementation of this dependency, real or scheduled?
├── Yes (R2 → S3, one email provider → another, payment gateway) ──► Interface + adapters
└── No ───────────────────────────────────────────────────────────► Plain module of functions
```

## Runtime

| Choose | When |
| --- | --- |
| Node.js + Express or Hono | Long-lived connections, heavy CPU work, large uploads through the server, full Node API needed, existing Node libraries. |
| Cloudflare Workers + Hono | Request/response APIs, edge latency matters, low baseline cost, bindings (KV/R2/D1/Queues) fit, no Node-only dependencies. |

See [23-decision-guides/backend-runtime.md](../23-decision-guides/backend-runtime.md).

## Database

| Choose | When |
| --- | --- |
| PostgreSQL | Default. Rich types (JSONB, arrays, enums), partial indexes, CTEs, strong constraints, extensions. |
| MySQL | Existing MySQL infrastructure or team expertise; simple relational workloads. |

See [23-decision-guides/databases.md](../23-decision-guides/databases.md).

## Deployment

| Choose | When |
| --- | --- |
| Platform (Railway, Render, Fly, Cloudflare Pages/Workers) | Default. No ops team. |
| Docker on a VM or platform | Reproducible builds; a platform that takes images; local parity. |
| Kubernetes | Many services, an ops team, autoscaling needs that a platform can't express. Rare. |

See [23-decision-guides/deployment.md](../23-decision-guides/deployment.md).

## Write the decision down

Keep a short `docs/decisions/NNNN-title.md` per non-obvious choice: context,
decision, consequences, date. Three paragraphs. Future you will want to know
*why*, and whether the reason still holds.

```markdown
# 0003 — No permanent delete for files
Date: 2026-05-12
Context: Users lost data via "Empty trash" in the previous tool.
Decision: Soft-delete only; no purge path in the app.
Consequences: Bucket grows without bound; storage cost is a manual concern.
```
