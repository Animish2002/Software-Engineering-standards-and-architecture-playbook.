# Reusable components on shadcn

How each common UI need is built once. Code for several lives in
[../19-reusable-patterns/frontend/](../19-reusable-patterns/frontend/README.md).

## Dialogs

| Component | Built from | Behaviour |
| --- | --- | --- |
| `ConfirmDialog` | `AlertDialog` | Title, description, destructive flag, async `onConfirm` with pending state; the only confirmation mechanism in the app |
| `FormDialog` | `Dialog` | Consistent header/description/footer slots; the child form owns submit; resets on close |
| `Sheet`-based mobile panels | `Sheet` | Same content components, different container under `md` |

Rules: controlled `open`/`onOpenChange` from the caller when opened from
menus; focus returns to the trigger (Radix does it); Escape/overlay close
disabled while pending.

## Tables

- `Table*` primitives directly for simple tables.
- `DataTable` (thin, TanStack Table) only when sorting/column visibility/selection repeat; it renders **only** the table. Toolbar, search, pagination are siblings.
- `RowMenu` (DropdownMenu) for per-row actions; trigger always visible on touch.
- Empty/loading/error handled outside the table by the state components.
- Truncate cells with `truncate` in a `min-w-0` cell; show full text in a `Tooltip`.

## Forms

- shadcn `Form` (react-hook-form context) + field wrappers in `components/forms/` ([../10-frontend/forms-and-validation.md](../10-frontend/forms-and-validation.md)).
- `FormActions` for the submit/cancel row.
- Server errors applied via `form.setError`.

## Dropdowns and menus

- `DropdownMenu` for actions; `Select` for single choice in forms; `Combobox` (`Popover` + `Command`) for searchable single choice; `MultiSelect` (`Popover` + `Command` with checkboxes) for recipients/tags.
- Menu items: `{ label, icon?, onSelect, destructive?, disabled? }`; destructive items use `text-destructive` and sit after a separator.

## Command menu

`Command` inside a `Dialog`, opened with `Ctrl/Cmd+K`: navigation and
quick actions. Register commands from features via a small registry hook
so the palette doesn't import every feature.

## Toasts

`sonner`: one `<Toaster richColors position="bottom-right" />` at the
root; `toast.success/error/promise`. Errors carry `error.message` from the
API result. No `alert()`.

## Loading

- `Skeleton` blocks assembled into `LoadingState` variants shaped like the real content.
- `Spinner` (a `Loader2` icon with `animate-spin`) inside buttons for pending actions.
- `Progress` for determinate work (uploads); thin top bar for revalidation.

## Empty and error

`EmptyState` and `ErrorState` from `common/`, with icon, title, description,
and one action slot.

## Navigation

- `Sidebar` block trimmed to the app's sections; permission-gated items via `Can`/`hasPermission`.
- `Breadcrumb` primitives inside an app `Breadcrumbs` that collapses the middle.
- `Tabs` for in-page sections; URL-synced when the tab is shareable.

## Tooltips and popovers

`Tooltip` for icon-only buttons (also sets `aria-label`); `Popover` for
small non-modal editors (rename inline, colour pick).

## Avoiding "every page independently"

Each row above exists so that no page implements its own version. When a
page needs something the catalog lacks, add it to `common/` **first**,
then use it; don't build it inline and "extract later".

## Related

- [composition.md](composition.md)
- [../10-frontend/components/catalog.md](../10-frontend/components/catalog.md)
