# Architecture principles

These hold for every structure described in this section.

## 1. Dependencies point inward

Transport and infrastructure depend on business logic; business logic depends
on nothing framework-specific.

```text
routes / controllers / UI  →  services / domain  ←  repositories / adapters
```

A service must be callable from an HTTP handler, a queue consumer, a cron
job, and a test with no changes.

## 2. Boundaries are explicit

A module exposes a small public surface (an `index.ts` or a documented set
of exports). Other modules import only that surface, never internal files.
If module A needs module B's table, it calls B's service, not B's repository.

## 3. Group by feature, layer within

Top-level folders are business concepts (`users`, `orders`, `shares`); inside
each, files are split by technical role. Grouping by role at the top level
(`controllers/`, `services/`) works only for small apps; see
[feature-based-architecture.md](feature-based-architecture.md).

## 4. One deployable until proven otherwise

Network boundaries cost latency, partial failure handling, distributed
transactions, and operational overhead. Add one only for a documented reason:
independent scaling profile, independent release cadence by a separate team,
or a hard isolation requirement.

## 5. Shared knowledge lives in shared packages

Types, validation schemas, and constants used by more than one app go in a
workspace package (`packages/shared-types`, `packages/validation`). Never
copy them.

## 6. The database is part of the architecture

Constraints, indexes, and transactions are design decisions, not
implementation details. Schema design happens with the module design, not
after it. See [03-databases/schema-design.md](../03-databases/schema-design.md).

## 7. Cross-cutting concerns are applied once

Authentication, authorization, logging, rate limiting, error mapping,
validation parsing: each is middleware or a wrapper configured in one place.

## 8. Every architecture has an exit

Choose structures that can be changed incrementally: a module can be
extracted, a repository swapped, a layer added. Avoid decisions that require a
rewrite to reverse (a shared mutable database across services, business logic
in stored procedures, UI logic in a vendor-specific DSL).

## 9. Measure, then structure

Add caching, queues, or services in response to measured problems, not
predicted ones. See [17-performance/README.md](../17-performance/README.md).

## Related

- [00-engineering-principles/separation-of-concerns.md](../00-engineering-principles/separation-of-concerns.md)
- [dependency-management.md](dependency-management.md)
