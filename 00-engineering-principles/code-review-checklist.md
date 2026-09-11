# Code review checklist (principles view)

The full, phase-by-phase checklist lives in
[21-checklists/code-review-checklist.md](../21-checklists/code-review-checklist.md).
This page states what a review is *for*, so the checklist is applied with
judgement rather than mechanically.

## What a review is for

1. **Correctness**: does it do what the ticket says, including edge cases and failure paths?
2. **Safety**: can it leak data, bypass auth, corrupt state, or take the service down?
3. **Maintainability**: will the next person understand and change it safely?
4. **Consistency**: does it follow the project's existing patterns, or improve them deliberately?

Not for: style nits a formatter should catch, personal preference, or
re-architecting the feature in the comments.

## How to review

- Read the description and the tests first; then the diff.
- Run it if the change touches behaviour you cannot verify by reading.
- Comment with the *reason*, not just the instruction ("this throws on empty arrays" beats "change this").
- Mark blocking vs. optional clearly.
- Approve when it's better than what's there, not when it's perfect.

## Questions to ask on every diff

- Where is the input validated? Where is authorization checked?
- What happens when the database call fails? When the request is repeated?
- Is any knowledge now in two places?
- Are the new names predictable from the existing ones?
- Does anything need an index, a migration, a changelog entry, a doc update?

## Related

- [21-checklists/code-review-checklist.md](../21-checklists/code-review-checklist.md)
- [18-devops/pull-requests.md](../18-devops/pull-requests.md)
