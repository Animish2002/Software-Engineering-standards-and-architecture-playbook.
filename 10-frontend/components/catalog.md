# Catalog: the shared components every app needs

Build these once, early, in `components/common/` and `components/forms/`,
on top of shadcn primitives. Every page then assembles them. Props shown
are the *entire* intended surface; resist growing them.

## States

| Component | Props | Notes |
| --- | --- | --- |
| `LoadingState` | `variant: 'list' \| 'grid' \| 'table' \| 'form' \| 'page'`, `rows?` | Skeletons shaped like the final layout |
| `ErrorState` | `title?`, `description?`, `onRetry?` | Icon + message + retry button |
| `EmptyState` | `icon?`, `title`, `description?`, `action?: ReactNode` | Primary action slot |
| `QueryState` | `query`, `skeleton`, `empty?`, `children: (data) => ReactNode` | Render-function wrapper that applies the loading contract; optional if pages are happy with three `if`s |

## Layout

| Component | Props |
| --- | --- |
| `PageHeader` | `title`, `description?`, `actions?`, `breadcrumbs?` |
| `PageContent` | `children`, `className?` (consistent max-width/padding) |
| `Toolbar` | `children`, `className?` (flex row, wraps on mobile) |
| `Section` | `title?`, `description?`, `children` |

## Data display

| Component | Props | Notes |
| --- | --- | --- |
| `Table*` (shadcn) | | Use directly; don't wrap in a mega-table |
| `DataTable` (optional, thin) | `columns: ColumnDef[]`, `rows`, `getRowId`, `onRowClick?`, `rowMenu?: (row) => MenuItem[]`, `sort?`, `onSortChange?` | TanStack Table under the hood; **no** search/pagination/toolbar inside; those are siblings |
| `Pagination` | `page`, `pageCount`, `onChange` | Offset style |
| `LoadMore` | `hasMore`, `isLoading`, `onLoadMore` | Cursor style |
| `RowMenu` | `items: MenuItem[]` (`{ label, icon?, onSelect, destructive? }`) | Dropdown trigger + items; always visible affordance on touch (no hover-only) |
| `StatCard` | `label`, `value`, `hint?`, `icon?` | |
| `KeyValueList` | `items: { label, value }[]` | |
| `FileTypeIcon` | `mimeType`, `size?` | |
| `Badge` (shadcn + `cva`) | `variant`, `size` | Status presets mapped centrally |
| `Breadcrumbs` | `crumbs`, `onNavigate`, `maxVisible?` | Collapses middle into an overflow menu; never scrolls |

## Interaction

| Component | Props | Notes |
| --- | --- | --- |
| `ConfirmDialog` | `open`, `onOpenChange`, `title`, `description?`, `confirmLabel?`, `destructive?`, `onConfirm: () => Promise<void> \| void` | `AlertDialog`; shows pending state; **replaces `confirm()`** |
| `FormDialog` | `open`, `onOpenChange`, `title`, `description?`, `children` | `Dialog` + consistent header/footer; the form inside decides submit |
| `SearchInput` | `value`, `onValueChange`, `placeholder?`, `debounceMs?` | Clear button; debounced callback optional |
| `FilterBar` | `children` | Wraps `Select`/`Combobox` filters; resets |
| `MultiSelect` | `options`, `value`, `onValueChange`, `placeholder?`, `loadOptions?` | Directory pickers; loads once on open |
| `Combobox` | `options`, `value`, `onValueChange`, `placeholder?` | shadcn Command + Popover |
| `Dropzone` | `onFiles(files: { file, relativePath }[])`, `accept?`, `multiple?`, `children?` | Drag-and-drop plus click picker; handles folders where the browser allows without native prompts |
| `CopyButton` | `value`, `label?` | Toast on copy |
| `ProgressPanel` | `items`, `onDismiss`, `collapsedByDefault?` | Capped height, "+N more" |

## Forms (`components/forms/`)

| Component | Props |
| --- | --- |
| `TextField` | `control`, `name`, `label`, `description?`, `type?`, `placeholder?`, `autoComplete?` |
| `TextareaField` | same |
| `SelectField` | `control`, `name`, `label`, `options: { value, label }[]`, `placeholder?` |
| `CheckboxField` / `SwitchField` | `control`, `name`, `label`, `description?` |
| `NumberField` | `control`, `name`, `label`, `min?`, `max?`, `step?`, `unit?` |
| `FormActions` | `submitLabel`, `isSubmitting`, `onCancel?` |

Each wraps shadcn `FormField` + `FormItem` + `FormLabel` + `FormControl` +
`FormDescription` + `FormMessage` so no page repeats that block.

## Auth

| Component | Props |
| --- | --- |
| `RequireAuth` | none; renders `<Outlet/>` or redirects |
| `RequirePermission` | `permission`; renders `<Outlet/>` or `ForbiddenState` |
| `Can` | `permission`, `children`, `fallback?` (inline gating of a button) |

## What is NOT in the catalog

- Anything that fetches.
- Anything with a `mode` prop.
- Page-specific compositions (`UsersTable` lives in `features/users`).

## Related

- [composition.md](composition.md)
- [../../12-shadcn/reusable-components.md](../../12-shadcn/reusable-components.md)
- [../../19-reusable-patterns/frontend/](../../19-reusable-patterns/frontend/README.md) (code for several of these)
