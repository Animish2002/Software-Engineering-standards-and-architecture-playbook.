# Responsive design

## Mobile-first

Unprefixed utilities apply to all sizes; prefixes add rules from that
breakpoint **up**. Write the phone layout first, then widen.

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
```

| Prefix | Min width | Typical meaning |
| --- | --- | --- |
| (none) | 0 | Phone |
| `sm:` | 640px | Large phone / small tablet |
| `md:` | 768px | Tablet; sidebar appears |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Wide |

Use `max-md:` sparingly for the rare "only below" rule.

## Layout rules that prevent bugs

- **`min-w-0` on flex/grid children that contain truncating text**, or they refuse to shrink and overflow the page.
- **`shrink-0` on toolbars/buttons beside variable content**; `flex-1 min-w-0` on the variable part.
- **`overflow-x-auto` only on tables/code/diagrams**, inside their own wrapper; the page body must never scroll horizontally.
- **Side gutter once** on the outer wrapper (`px-4 md:px-6`), not per component.
- **`max-w-full` on images and `aspect-*` boxes.**
- **Height caps, not fixed heights**, for panels that hold variable content: `max-h-[min(45vh,16rem)] overflow-y-auto`.
- **`min-h-svh`** (small viewport height) for full-height shells on mobile, not `h-screen`.
- **Touch targets ≥ 44px**; use `size-11` on icon buttons on mobile if the design allows.
- **Hover is not a state on touch**: actions revealed by `group-hover` must also be reachable (always-visible menu button on mobile, or `md:opacity-0 md:group-hover:opacity-100`).

## Container queries (v4 built-in)

When a component's layout should depend on **its container**, not the
viewport (a card in a sidebar vs in a grid):

```tsx
<div className="@container">
  <div className="flex flex-col @md:flex-row">…</div>
</div>
```

Prefer container queries for reusable components; viewport breakpoints for
page layout.

## Reading breakpoints in JS

Only when rendering *different components* (a `Sheet` vs a `Sidebar`, 1
crumb vs 3): `useMediaQuery('(min-width: 768px)')`. Keep the breakpoint
value in one constant shared with CSS (`--breakpoint-md`).

## Testing

Check at ~400px, 768px, 1024px, and 1440px. Chrome DevTools device
toolbar plus a real phone for touch.

## Related

- [organization.md](organization.md)
- [../10-frontend/layouts.md](../10-frontend/layouts.md)
