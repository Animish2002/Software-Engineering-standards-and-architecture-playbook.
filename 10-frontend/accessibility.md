# Accessibility

Accessible by default is cheaper than accessible later. shadcn/Radix
primitives handle most of the hard parts (focus trapping, ARIA roles,
keyboard navigation); the rest is discipline.

## Rules

| Area | Rule |
| --- | --- |
| **Semantics** | Native elements first: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<table>` for tabular data. A `div` with `onClick` is not a button. |
| **Keyboard** | Everything clickable is reachable and operable with Tab/Enter/Space; menus with arrows; Escape closes dialogs. Test by unplugging the mouse. |
| **Focus** | Visible focus ring (don't remove `outline` without a replacement); focus moves into dialogs and returns on close (Radix does this); after navigation, focus the page heading or main. |
| **Labels** | Every input has a `<label>` (shadcn `FormLabel`); icon-only buttons have `aria-label`; images have `alt` (empty `alt=""` for decorative). |
| **Contrast** | 4.5:1 for text, 3:1 for large text and UI borders. Check the token palette once in both themes. |
| **Motion** | Respect `prefers-reduced-motion` for non-essential animation. |
| **Live regions** | Toasts and async status announce via `aria-live="polite"` (sonner does); progress bars have `role="progressbar"` with `aria-valuenow`. |
| **Errors** | Field errors linked with `aria-describedby` and `aria-invalid` (shadcn `FormMessage` does); error summary focusable. |
| **Touch targets** | ≥ 44×44 px on mobile; adequate spacing. |
| **Drag and drop** | Provide a non-drag alternative (menu "Move to…") because DnD isn't keyboard-accessible by default. |
| **Color** | Never the only signal (status dots + text/icon). |

## Checks

- `eslint-plugin-jsx-a11y` in the lint config.
- Lighthouse accessibility audit ≥ 95 on key pages.
- Manual keyboard pass on every new dialog, menu, and form.
- Screen reader spot-check (NVDA on Windows, VoiceOver on Mac) for the primary flow.

## Related

- [12-shadcn/README.md](../12-shadcn/README.md)
- [components/catalog.md](components/catalog.md)
