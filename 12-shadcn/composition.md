# Composition with shadcn

shadcn components are already compound: `Dialog` + `DialogTrigger` +
`DialogContent` + `DialogHeader`… Compose them into app-level parts; don't
wrap them in configuration.

## Example: a share dialog, composed

```tsx
export function ShareDialog({ item, open, onOpenChange }: Props) {
  const { data: shares, isLoading } = useShares(item.id);
  const createLink = useCreateLinkShare();
  const shareWithPeople = useShareWithPeople();
  const [recipients, setRecipients] = useState<DirectoryUser[]>([]);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`Share "${item.name}"`}>
      <Tabs defaultValue="people">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="people">People</TabsTrigger><TabsTrigger value="link">Link</TabsTrigger></TabsList>

        <TabsContent value="people" className="space-y-3">
          <MultiSelect value={recipients} onValueChange={setRecipients} loadOptions={api.users.directory} placeholder="Add people…" />
          <PermissionSelect value={permission} onValueChange={setPermission} />
          <FormActions submitLabel="Share" isSubmitting={shareWithPeople.isPending} onSubmit={async () => {
            const res = await shareWithPeople.mutateAsync({ resourceId: item.id, emails: recipients.map((r) => r.email), permission });
            reportPerRecipient(res);                 // toasts naming who missed out; reselects failures
          }} />
        </TabsContent>

        <TabsContent value="link" className="space-y-3">
          {isLoading ? <LoadingState variant="list" rows={2} /> : <ShareLinkList shares={shares} onRevoke={…} />}
          <Button variant="outline" onClick={() => createLink.mutate({ resourceId: item.id })}>Create link</Button>
        </TabsContent>
      </Tabs>
    </FormDialog>
  );
}
```

Everything reused (`FormDialog`, `Tabs*`, `MultiSelect`, `FormActions`,
`LoadingState`, `Button`) is generic; everything feature-specific
(`PermissionSelect`, `ShareLinkList`, the hooks) lives in `features/shares`.

## Patterns

| Pattern | Example |
| --- | --- |
| `asChild` to merge behaviour into your element | `<DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>` |
| Slots via children | `DialogFooter` accepts whatever buttons the flow needs |
| Popover + Command for pickers | Combobox, multi-select, command palette all share the two primitives |
| Sheet on mobile, Dialog on desktop | Same inner content component; container chosen by `useMediaQuery` |
| Controlled open state from a menu | `RowMenu` sets `dialog = 'rename'`; page renders `<RenameDialog open={dialog === 'rename'} …/>` |

## Anti-patterns

- `<AppDialog type="share" | "rename" | "move" />` dispatching on a prop.
- Re-implementing a Radix behaviour (focus trap, escape, outside click) in a custom component.
- Passing `className` deep into a primitive's internals from a page instead of adding a variant/slot.
- One giant `components/common/Modal.tsx` that every flow adds props to.

## Related

- [reusable-components.md](reusable-components.md)
- [../10-frontend/components/composition.md](../10-frontend/components/composition.md)
