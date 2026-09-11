# Reusable components

The goal is to stop this:

```text
UsersPage    → its own table, its own dialog, its own empty state
OrdersPage   → copy of the table, copy of the dialog, copy of the empty state (slightly different)
FilesPage    → third copy, now diverged
```

without creating this:

```jsx
<DataTable {...fortyProps} />
```

| Document | Answers |
| --- | --- |
| [composition.md](composition.md) | Small primitives assembled per use, instead of configurable monoliths. |
| [variants.md](variants.md) | Visual variants with `cva`; behavioural variants are separate components. |
| [controlled-vs-uncontrolled.md](controlled-vs-uncontrolled.md) | Which to support in shared components. |
| [compound-components.md](compound-components.md) | Coordinated parts with shared context. |
| [catalog.md](catalog.md) | The shared components every app needs: tables, dialogs, cards, filters, pagination, loading/error/empty states, forms. |
| [when-not-to-reuse.md](when-not-to-reuse.md) | Duplication that is cheaper than abstraction. |

## Folder layout

```text
components/
├── ui/            shadcn primitives: Button, Dialog, Table, Input, Select, DropdownMenu, …  (generated)
├── common/        app-level building blocks: PageHeader, EmptyState, ErrorState, LoadingState, ConfirmDialog, Pagination, SearchInput, DataTable parts
├── forms/         TextField, SelectField, CheckboxField, FormActions (wrappers over shadcn Form)
├── data-display/  StatCard, KeyValueList, Badge presets, FileTypeIcon (optional folder; fold into common/ if small)
└── layouts/       (or app/layouts) AppLayout, AuthLayout, PageContent
```

Feature-specific components stay in their feature.

## The rules

1. **Primitives compose; pages assemble.** A page that needs a table with a search box and a create button assembles `Table` + `SearchInput` + `Button`; it doesn't pass `showSearch` and `createLabel` to a mega-table.
2. **Visual variants via `cva`; behavioural variants via separate components.** `Button variant="destructive"` is fine; `DataTable mode="serverSide"` is a second component.
3. **Extract on the third use**, when the uses change together.
4. **Shared components have no business logic and no data fetching.** They take data and callbacks.
5. **Every shared component forwards `className` and native props**, so a page can adjust spacing without a new prop.
6. **States are components**: `LoadingState`, `ErrorState`, `EmptyState`, used by every page.
7. **Keep ui/ close to upstream.** Customise through tokens and `cva` variants, not by rewriting generated components.

## Related

- [../../12-shadcn/README.md](../../12-shadcn/README.md)
- [../../00-engineering-principles/abstraction-guidelines.md](../../00-engineering-principles/abstraction-guidelines.md)
