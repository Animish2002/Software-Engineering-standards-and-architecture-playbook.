# 00 — Engineering principles

The rules that apply regardless of language, framework, or project size. Every
other section in this repository assumes these.

| Document | Answers |
| --- | --- |
| [clean-code.md](clean-code.md) | What does readable, maintainable code look like day to day? |
| [dry-kiss-yagni.md](dry-kiss-yagni.md) | When is duplication acceptable, and when is simplicity the wrong call? |
| [separation-of-concerns.md](separation-of-concerns.md) | How do I decide what belongs together and what must be kept apart? |
| [single-responsibility.md](single-responsibility.md) | How big should a function, module, or component be? |
| [abstraction-guidelines.md](abstraction-guidelines.md) | Useful abstraction vs. premature abstraction, with examples of each. |
| [avoiding-code-redundancy.md](avoiding-code-redundancy.md) | The concrete places duplication hides in a full-stack app and how to remove it. |
| [naming-conventions.md](naming-conventions.md) | Files, folders, functions, classes, variables, database objects, API paths. |
| [error-handling.md](error-handling.md) | One error strategy for the whole system. |
| [logging.md](logging.md) | What to log, what never to log, structured logs. |
| [configuration-management.md](configuration-management.md) | Environment variables, validation at boot, no config in code. |
| [code-review-checklist.md](code-review-checklist.md) | What a reviewer looks for (points to the full checklist). |

## The short version

1. **Optimise for the reader.** Code is read far more than it is written.
2. **Simple first.** Add structure when a concrete need appears, not before.
3. **One reason to change per unit.** Function, module, component, service.
4. **Duplication is cheaper than the wrong abstraction.** Three similar copies with different reasons to change are fine. Three copies with the same reason to change are a bug waiting to happen.
5. **Errors are part of the design.** Decide how failures are represented, propagated, and reported before writing the happy path.
6. **Configuration is data, validated at startup.** Never read `process.env` deep in business code.
7. **Measure before optimising.** See [17-performance/](../17-performance/README.md).
8. **Security is a default, not a feature.** See [15-security/](../15-security/README.md).

## Related

- [01-project-architecture/](../01-project-architecture/README.md) applies these at the system level.
- [23-decision-guides/code-organization.md](../23-decision-guides/code-organization.md) turns them into decision trees.
