# 01 — Project architecture

How to shape a whole system: one deployable or many, how code is grouped
inside it, and how dependencies are allowed to flow.

| Document | Answers |
| --- | --- |
| [architecture-principles.md](architecture-principles.md) | The rules every architecture below must obey. |
| [monolith.md](monolith.md) | The default for a new product. |
| [modular-monolith.md](modular-monolith.md) | The default once a monolith has more than a few features. |
| [microservices.md](microservices.md) | What it costs, and the few cases where it pays. |
| [layered-architecture.md](layered-architecture.md) | Controller → service → repository, and its limits. |
| [feature-based-architecture.md](feature-based-architecture.md) | Grouping by feature/module instead of by technical type. |
| [clean-and-hexagonal.md](clean-and-hexagonal.md) | Ports and adapters: the useful core, without the ceremony. |
| [dependency-management.md](dependency-management.md) | Direction of imports, shared packages, monorepos. |
| [choosing-an-architecture.md](choosing-an-architecture.md) | The decision, in one page. |

## The default recommendation

```text
New project        → Monolith, feature-based folders, layered inside each feature
> ~5 features      → Modular monolith: enforce module boundaries, shared packages
Proven scaling or
team-boundary need → Extract one service at a time from the modular monolith
```

Most applications never need to leave the second line. See
[23-decision-guides/architecture.md](../23-decision-guides/architecture.md).

## Related

- [02-backend/architecture.md](../02-backend/architecture.md) applies this inside a backend.
- [10-frontend/architecture.md](../10-frontend/architecture.md) applies this inside a frontend.
