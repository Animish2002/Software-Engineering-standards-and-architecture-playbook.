# 12 — shadcn/ui

shadcn/ui is not a component library you install; it's a set of
accessible, styled components (Radix primitives + Tailwind + `cva`) that
the CLI **copies into your repo**. You own the code. The standards here
keep that ownership from turning into forty diverging copies.

| Document | Answers |
| --- | --- |
| [component-organization.md](component-organization.md) | `ui/` vs `common/`; what to add; keeping generated files clean. |
| [customization.md](customization.md) | Tokens first; `cva` variants second; structural edits last. |
| [reusable-components.md](reusable-components.md) | Building app-level components on shadcn: dialogs, tables, forms, menus, command, toasts, loading. |
| [variants.md](variants.md) | Adding variants the shadcn way. |
| [composition.md](composition.md) | Composing primitives so pages don't re-implement UI. |

## Setup (Vite + Tailwind v4)

```bash
npx shadcn@latest init            # picks style, base colour, CSS variables; writes components.json, globals.css, lib/utils.ts (cn)
npx shadcn@latest add button dialog alert-dialog dropdown-menu table input label select form sonner skeleton badge tooltip sheet command popover checkbox switch tabs separator
```

`components.json` defines aliases (`@/components/ui`, `@/lib/utils`) and
the style preset. Commit it.

## The one rule

**Pages don't restyle primitives.** If a page needs a different-looking
button, that's a variant on `Button`. If it needs a confirm flow, that's
`ConfirmDialog` in `components/common`. Every page gets it for free after
that. See [composition.md](composition.md).
