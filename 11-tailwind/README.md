# 11 — Tailwind CSS

Tailwind v4 (CSS-first configuration) in a React + shadcn project. The
recurring question is not "how do I write utilities" but "how do I keep
fourteen-utility class strings from being pasted across forty files".

| Document | Answers |
| --- | --- |
| [organization.md](organization.md) | Setup, file layout, class ordering, `cn()`. |
| [design-tokens.md](design-tokens.md) | `@theme`, CSS variables, shadcn tokens, dark mode. |
| [responsive-design.md](responsive-design.md) | Mobile-first breakpoints, container queries, layout rules. |
| [reusable-patterns.md](reusable-patterns.md) | `cva`, components, `@apply` (rarely), data attributes. |
| [avoiding-duplication.md](avoiding-duplication.md) | The decision: utilities vs component vs CSS abstraction. |
| [component-styling.md](component-styling.md) | Styling shared components so pages don't restyle them. |

## Setup (v4)

```bash
npm i tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "tw-animate-css";              /* if shadcn animations are used */
@custom-variant dark (&:is(.dark *));  /* class-based dark mode */

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* … shadcn token bridge, see design-tokens.md */
}
```

No `tailwind.config.js` needed in v4; content detection is automatic.
A JS config is only for legacy plugins.

## The decision in one line

```text
one-off layout        → utilities inline
repeated visual unit  → component (+ cva for variants)
global primitive      → @theme token / base layer CSS
never                 → @apply for page-level styles
```

See [avoiding-duplication.md](avoiding-duplication.md).
