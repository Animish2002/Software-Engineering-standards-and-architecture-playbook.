# Variants in shadcn components

shadcn components use `cva` and export both the component and its
`*Variants` function so other components can borrow the classes.

```tsx
// ui/button.tsx (excerpt)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
export { Button, buttonVariants };
```

## Adding a variant

1. Add the key under `variants.variant` (or `size`) with semantic-token classes.
2. Types update automatically (`VariantProps`).
3. Use it: `<Button variant="success">`.

Don't add a variant for a single page. Add it when the design system has
the concept (success, warning, subtle).

## Borrowing variants

```tsx
<AlertDialogAction className={buttonVariants({ variant: 'destructive' })}>Delete</AlertDialogAction>
<Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/users">Users</Link>
```

Or `asChild`: `<Button asChild variant="outline"><Link to="/users">Users</Link></Button>`.

## Compound variants

```ts
compoundVariants: [{ variant: 'outline', size: 'icon', class: 'border-dashed' }],
```

For combinations that need adjustment; keep them few.

## Size variants and touch

Add `'icon-sm'`/`'icon-lg'` rather than arbitrary `size-*` overrides at
call sites; mobile targets can use `size="icon-lg"`.

## Related

- [customization.md](customization.md)
- [../10-frontend/components/variants.md](../10-frontend/components/variants.md)
