# ConfirmDialog

```tsx
// components/common/confirm-dialog.tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
};

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, onConfirm }: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();                                // keep the dialog open until the promise settles
    setPending(true);
    try { await onConfirm(); onOpenChange(false); }
    finally { setPending(false); }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!pending) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction className={cn(destructive && buttonVariants({ variant: 'destructive' }))} disabled={pending} onClick={handleConfirm}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

```tsx
// usage
const [confirmTrash, setConfirmTrash] = useState<DriveItem | null>(null);
<RowMenu items={[{ label: 'Move to trash', destructive: true, onSelect: () => setConfirmTrash(item) }]} />
<ConfirmDialog
  open={!!confirmTrash}
  onOpenChange={(o) => !o && setConfirmTrash(null)}
  title={`Move "${confirmTrash?.name}" to trash?`}
  description="You can restore it from Trash later."
  confirmLabel="Move to trash"
  destructive
  onConfirm={async () => {
    const res = await trash.mutateAsync(confirmTrash!.id);
    if (!res.ok) { toast.error(res.error.message); throw new Error(res.error.message); }   // keeps the dialog open
    toast.success('Moved to trash');
  }}
/>
```

Related: [12-shadcn/reusable-components.md](../../12-shadcn/reusable-components.md)
