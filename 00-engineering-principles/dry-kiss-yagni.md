# DRY, KISS, YAGNI

## What are they?

- **DRY** (Don't Repeat Yourself): every piece of *knowledge* has one authoritative representation.
- **KISS** (Keep It Simple): the simplest design that meets the real requirement.
- **YAGNI** (You Aren't Gonna Need It): don't build for a requirement that doesn't exist yet.

## Why do they matter?

They pull in slightly different directions, and getting the balance wrong is
the most common architectural failure in small and medium codebases:

- Over-applying DRY produces abstractions that couple unrelated code.
- Over-applying KISS produces copy-paste that drifts.
- Ignoring YAGNI produces frameworks inside applications.

## DRY: what counts as repetition

DRY is about **knowledge**, not text. Two functions with identical bodies are
*not* duplicates if they will change for different reasons.

| Situation | Duplicate? | Action |
| --- | --- | --- |
| The same validation rule (email format) in the API and the form | Yes, same knowledge | One Zod schema in a shared package. |
| Two React components that look alike today but serve different features | Not yet | Leave them. Extract when the third appears *and* they change together. |
| The same SQL `WHERE deleted_at IS NULL` in 12 queries | Yes | A query helper or a view; see [03-databases/soft-deletes-and-audit-columns.md](../03-databases/soft-deletes-and-audit-columns.md). |
| Two services that both call `fetch` with the same headers | Yes | One HTTP client (see [10-frontend/api-integration.md](../10-frontend/api-integration.md)). |
| Two error responses with the same JSON shape | Yes | One envelope helper (see [05-apis/response-format.md](../05-apis/response-format.md)). |

**The rule of three:** tolerate two copies. On the third, extract, but only if
all three change for the same reason.

## KISS: the simplest thing that works

- A function beats a class. A class beats a hierarchy. A hierarchy beats a plugin system.
- A single file beats a folder of one-function files.
- A direct database call in a service beats a repository interface with one implementation, *until* you have a second implementation or need to test without a database.
- A monolith beats microservices until the team or the scaling profile demands otherwise (see [01-project-architecture/choosing-an-architecture.md](../01-project-architecture/choosing-an-architecture.md)).

Simplicity is measured by how much a reader must hold in their head to
understand a change, not by line count.

## YAGNI: what not to build yet

Skip until a concrete requirement exists:

- Multi-tenancy plumbing when there is one tenant.
- Generic "BaseRepository<T>" when there are two tables.
- Event buses inside a monolith to "prepare for microservices".
- Feature flags for features that have shipped.
- Configurable everything. Configuration is code you cannot type-check.

Do **not** skip, because retrofitting is expensive:

- Validation at boundaries.
- Structured error handling.
- Database constraints and indexes on foreign keys.
- Environment-based configuration.
- Logging with request correlation.
- Tests for business rules.

## Example: the three principles in one change

Requirement: "Users can export their orders as CSV."

```text
Avoid  : build an ExportService with pluggable formatters (CSV, XLSX, PDF),
         a job queue, and a download-token system.            (YAGNI)
Avoid  : copy the order-listing query into the export handler.  (DRY)
Do     : reuse the existing listOrders(userId) query, stream rows to CSV
         in the handler, return text/csv.                    (KISS)
```

When XLSX is requested, *then* extract a formatter.

## Common mistakes

- Extracting an abstraction because two things look similar, not because they share a reason to change.
- Treating "simple" as "no structure". A 2,000-line file is not simple.
- Using YAGNI to skip constraints, validation, or tests.

## Checklist

- [ ] Shared *knowledge* (rules, shapes, constants) lives in exactly one place.
- [ ] No abstraction has fewer than three real callers, unless it exists for testability.
- [ ] No code exists for a requirement that is not on the current roadmap.
- [ ] Non-negotiables (validation, constraints, errors, config, logging) are present from day one.

## Related

- [abstraction-guidelines.md](abstraction-guidelines.md)
- [avoiding-code-redundancy.md](avoiding-code-redundancy.md)
- [23-decision-guides/code-organization.md](../23-decision-guides/code-organization.md)
