# When NOT to make something reusable

## Signs that duplication is the right call

| Situation | Why leave it |
| --- | --- |
| Two components look alike but belong to different features with different owners and change reasons (a share dialog and a user-invite dialog) | They will diverge; a shared one grows flags |
| A component is used once | Reuse is hypothetical; YAGNI |
| The "shared" version would need a `mode`/`type` prop to behave differently per caller | That's two components |
| The duplicated part is layout glue (a flex row with a gap) | Tailwind utilities *are* the abstraction |
| Extracting would require passing most of the page's state into the component | The page is the right owner |
| The components share markup but not behaviour, or behaviour but not markup | Share the primitive (or the hook), not the composed thing |

## The cost of a premature shared component

- Every consumer is coupled: a change for one risks the others.
- Props accumulate; the component becomes the hardest file to read.
- Nobody deletes it, even when only one caller remains.
- It becomes "the way", so new pages contort to fit it.

## What to share instead

| Instead of sharing... | Share... |
| --- | --- |
| A whole "list page" component | `PageHeader`, `Toolbar`, `Table*`, `Pagination`, `EmptyState`; assemble per page |
| A "smart" form component that knows every entity | Field wrappers + the Zod schema |
| A dialog that handles five different flows | `ConfirmDialog`, `FormDialog`; flow-specific content per feature |
| A card that renders any entity | Card primitives; a feature-specific `FileCard` |
| A hook that fetches "anything" | One hook per resource over the API layer |

## Rule of three, applied

Copy the second time. On the third, check:

1. Same reason to change? If a design change to one must apply to all, extract. If not, leave.
2. Can the extracted thing be named by what it is (not by where it came from)?
3. Will the extracted surface be smaller than the three copies combined?

If any answer is no, don't extract yet.

## Deleting a bad abstraction

Inline it into its callers, run the tests, delete the file. Duplication
you can read beats indirection you can't follow.

## Related

- [../../00-engineering-principles/abstraction-guidelines.md](../../00-engineering-principles/abstraction-guidelines.md)
- [composition.md](composition.md)
