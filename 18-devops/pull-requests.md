# Pull requests

## Size

Under ~400 changed lines of real code. Larger changes are split by
layer (schema → API → UI) or by step (refactor → feature). A reviewer
can hold one PR in their head; they can't hold three features.

## Description

- **What and why** in a paragraph. Link the issue.
- **How to verify**: commands, test names, or click-path.
- **Risk notes**: migration? permission change? config change? rollback plan?
- Screenshots/recordings for UI changes.
- Fill the template; don't delete sections.

## Author checklist before requesting review

- [ ] CI green (lint, typecheck, tests, build).
- [ ] Self-reviewed the diff on GitHub (you'll spot debug code and stray files).
- [ ] Tests for new rules and endpoints; tenancy tests for new mutating endpoints.
- [ ] Migration read; `EXPECTED_INDEXES`/`db:check` updated if indexes changed.
- [ ] Docs updated (README endpoints/permissions/schema; CHANGELOG; CLAUDE.md scope).
- [ ] No secrets, no `console.log`, no commented-out code, no native dialogs.

## Review flow

1. Reviewer reads description and tests first, then the diff.
2. Comments are prefixed for clarity: `blocking:`, `suggestion:`, `question:`, `nit:`.
3. Author responds to every comment (fix, or explain why not).
4. Approve when it's better than `main` and safe, not when it's perfect.
5. Author merges (squash) after approval and green CI; branch auto-deletes.

Turnaround target: first review within one working day. Small PRs make
this possible.

## Merging

- Squash and merge; PR title becomes the commit subject (Conventional Commits format).
- Never merge red CI; never bypass protections "just this once".
- Merge queue if concurrent merges break `main`.

## Reviewing with AI assistance

A code-review tool (including Claude Code's review) is a first pass for
correctness and consistency, not a substitute for a human approval on
anything touching auth, permissions, schema, or money.

## Related

- [21-checklists/code-review-checklist.md](../21-checklists/code-review-checklist.md)
- [github.md](github.md)
