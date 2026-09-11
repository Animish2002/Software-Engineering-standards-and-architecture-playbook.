import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { CurrentUserProvider } from '@/lib/current-user';
import { ThemeProvider } from '@/lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CurrentUserProvider>
        {children}
        <Toaster richColors position="bottom-right" />
      </CurrentUserProvider>
    </ThemeProvider>
  );
}
