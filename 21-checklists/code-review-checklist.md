# Code review checklist

## Before reading the diff

- [ ] The description says what and why; the PR is small enough to hold in your head.
- [ ] CI is green.
- [ ] Tests exist for the behaviour claimed.

## Correctness

- [ ] Does what the ticket asks, including edge cases: empty, null, duplicate, concurrent, huge.
- [ ] Failure paths handled: what happens when the DB call fails, the email fails, the request repeats?
- [ ] Input validated at the boundary; identity from the token.
- [ ] Authorization: capability **and** scope checked; other users' resources → 404.
- [ ] Transactions where multiple writes must agree; no I/O inside them.
- [ ] Soft-delete filters applied; uniqueness constrained in the DB.

## Design

- [ ] Code is in the right layer and module; no business logic in controllers/components/lib.
- [ ] No knowledge duplicated (validation, types, envelope, error mapping).
- [ ] No new abstraction with fewer than three callers (unless for testability); no `mode` props.
- [ ] Names predictable from existing conventions.
- [ ] Simplest thing that works; nothing built for imagined requirements.

## Data and performance

- [ ] Migration read; compatible with running code; indexes for new queries; `EXPECTED_INDEXES` updated.
- [ ] No N+1; no `SELECT *` on hot paths; pagination bounded.
- [ ] No new sync blocking calls; outbound calls have timeouts.

## Frontend

- [ ] Uses catalog components; no restyled primitives per page; tokens not palette colours.
- [ ] Loading/revalidating contract respected; no skeleton over existing data.
- [ ] No `fetch` in components; no tokens in storage; no native dialogs.
- [ ] Accessible: keyboard, labels, focus.

## Security

- [ ] No secrets, no logging of sensitive values, no raw SQL with input, no unsanitised HTML.
- [ ] New public route? Justified and rate-limited.

## Docs and hygiene

- [ ] README/CHANGELOG/CLAUDE.md updated where endpoints, permissions, schema, or known gaps changed.
- [ ] No debug code, commented-out code, or unrelated changes.
- [ ] Commit message follows Conventional Commits.

## Review etiquette

- Prefix comments: `blocking:`, `suggestion:`, `question:`, `nit:`.
- Explain the reason, not just the instruction.
- Approve when it's better than `main` and safe.

## Related

- [00-engineering-principles/code-review-checklist.md](../00-engineering-principles/code-review-checklist.md)
- [18-devops/pull-requests.md](../18-devops/pull-requests.md)
