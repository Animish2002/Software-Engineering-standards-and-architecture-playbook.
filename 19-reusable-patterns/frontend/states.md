# Loading, error, and empty states

```tsx
// components/common/states.tsx
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type LoadingVariant = 'list' | 'grid' | 'table' | 'form' | 'page';

export function LoadingState({ variant = 'list', rows = 6, className }: { variant?: LoadingVariant; rows?: number; className?: string }) {
  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6', className)} aria-busy>
        {Array.from({ length: rows * 2 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-lg" />)}
      </div>
    );
  }
  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)} aria-busy>
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    );
  }
  if (variant === 'form') {
    return <div className={cn('space-y-4', className)} aria-busy>{Array.from({ length: rows }, (_, i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-full" /></div>)}</div>;
  }
  if (variant === 'page') {
    return <div className={cn('space-y-6', className)} aria-busy><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /><LoadingState variant="list" rows={rows} /></div>;
  }
  return <div className={cn('space-y-2', className)} aria-busy>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
}

type StateProps = { icon?: LucideIcon; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string };

function CenteredState({ icon: Icon, title, description, action, className, tone = 'muted' }: StateProps & { tone?: 'muted' | 'destructive' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center', className)}>
      {Icon && <Icon className={cn('size-10', tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground')} aria-hidden />}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <CenteredState icon={Inbox} {...props} />;
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, className }: { title?: string; description?: React.ReactNode; onRetry?: () => void; className?: string }) {
  return (
    <CenteredState
      icon={AlertTriangle} tone="destructive" title={title} description={description} className={className}
      action={onRetry && <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw className="mr-2 size-4" aria-hidden />Try again</Button>}
    />
  );
}
```

```tsx
// usage in a page
if (isLoading) return <LoadingState variant="grid" />;
if (error && !data) return <ErrorState description={error.message} onRetry={refetch} />;
if (data.items.length === 0) return <EmptyState title="This folder is empty" description="Upload files or create a folder." action={<Button onClick={openUpload}>Upload</Button>} />;
```

Related: [10-frontend/error-and-loading-states.md](../../10-frontend/error-and-loading-states.md)
