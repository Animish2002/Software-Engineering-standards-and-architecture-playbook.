# Avoiding Tailwind duplication

## The three options

| Option | What it is | Use when | Don't when |
| --- | --- | --- | --- |
| **Utilities inline** | Classes on the element in JSX | Layout glue; one-off spacing; anything that doesn't repeat | The same 8+ utilities appear in three files |
| **Component (+ `cva`)** | A React component owns the classes and exposes variants | A visual unit repeats: card, badge, toolbar, row, tile | It would need behavioural `mode` props |
| **CSS abstraction** (`@theme` token, `@layer base`, minimal `@apply`) | A global value or element default | Tokens, resets, third-party markup | Naming page-level styles |

## Where duplication actually shows up

| Duplication | Fix |
| --- | --- |
| The same card shell on every card-like thing | `Card` component with `padding`/`interactive` variants |
| The same status badge colouring logic in five tables | `Badge` variants + one status→variant map |
| The same input styling in custom inputs | Use shadcn `Input`; never restyle inputs per page |
| `flex items-center justify-between` on every header | Fine to repeat; it's three utilities. Or `PageHeader`/`Toolbar` if the whole header repeats |
| Page padding/max-width per page | `PageContent` |
| Focus ring utilities on every interactive element | `focus-visible:ring-*` set once in the primitive (`Button`, `Card interactive`) |
| Icon button sizing | `Button size="icon"` |
| Truncation stack (`truncate min-w-0`) on every name cell | Acceptable; it's two utilities. If you also add a tooltip each time, make `TruncatedText` |
| Dark-mode overrides (`dark:bg-…`) on every element | Use semantic tokens; drop `dark:` |
| Arbitrary values repeated | Token |

## The test before extracting a style

1. Does the same *meaningful unit* (not just the same utilities) appear three times?
2. Would a design change to one need to apply to all?
3. Can it be named by what it is (`StatCard`), not by its classes (`RoundedBorderBox`)?

Three yeses → component. Otherwise leave the utilities.

## Bad example

```tsx
// Avoid: same shell copied, drifting
<div className="rounded-lg border bg-card p-4 shadow-sm hover:bg-accent/50">…</div>       // UsersPage
<div className="rounded-lg border bg-card p-4 shadow hover:bg-accent/40">…</div>          // FilesPage (already different)
<div className="rounded-md border bg-card p-3 shadow-sm hover:bg-muted">…</div>           // SharesPage
```

```tsx
// Recommended
<Card interactive>…</Card>
```

## Also bad: the CSS-class route

```css
.card { @apply rounded-lg border bg-card p-4 shadow-sm; }
.card--hover { @apply hover:bg-accent/50; }
```

Now there's a naming scheme, a stylesheet to keep in sync, no type safety
on variants, and no `className` merge. The component version gives all of
that for the same line count.

## Related

- [reusable-patterns.md](reusable-patterns.md)
- [../10-frontend/components/when-not-to-reuse.md](../10-frontend/components/when-not-to-reuse.md)
- [../00-engineering-principles/avoiding-code-redundancy.md](../00-engineering-principles/avoiding-code-redundancy.md)
