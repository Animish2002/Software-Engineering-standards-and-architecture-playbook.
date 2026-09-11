# Customizing shadcn

Customise from the outside in. Each level is cheaper and safer than the
next.

## Level 1: tokens (most changes)

Colours, radius, fonts, and spacing come from CSS variables in
`globals.css`. Rebrand = edit `:root` and `.dark`. No component changes.
See [../11-tailwind/design-tokens.md](../11-tailwind/design-tokens.md).

```css
:root { --primary: oklch(0.55 0.2 260); --radius: 0.5rem; }
```

## Level 2: variants in the component's `cva`

Need a new look for an existing primitive: add a variant, don't fork the
component. See [variants.md](variants.md).

```tsx
// ui/button.tsx
variant: { default: '…', destructive: '…', outline: '…', secondary: '…', ghost: '…', link: '…',
           success: 'bg-success text-success-foreground hover:bg-success/90' },
size:    { default: '…', sm: '…', lg: '…', icon: '…', 'icon-sm': 'size-8' },
```

## Level 3: wrap in `common/`

Need app behaviour (pending state, confirm flow, consistent header/footer):
compose the primitive into a `common/` component. The primitive stays
untouched.

```tsx
// common/confirm-dialog.tsx
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', destructive, onConfirm }: Props) {
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle>{description && <AlertDialogDescription>{description}</AlertDialogDescription>}</AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction className={cn(destructive && buttonVariants({ variant: 'destructive' }))} disabled={pending}
            onClick={async (e) => { e.preventDefault(); setPending(true); try { await onConfirm(); onOpenChange(false); } finally { setPending(false); } }}>
            {pending ? <Spinner className="mr-2" /> : null}{confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Level 4: structural edits to `ui/` (rare)

Only for accessibility fixes, forwarding a needed prop, or removing a
part you never use. Keep a comment at the top of the file listing the
edits so a future re-add can reapply them.

## Never

- Copy a `ui/` component into a feature folder and modify it there.
- Override internals from pages with arbitrary selectors (`[&>svg]:…` on every usage).
- Use raw palette colours in a variant.
- Edit `ui/` for a one-page need.

## Related

- [variants.md](variants.md)
- [reusable-components.md](reusable-components.md)
