'use client';

import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { QueryProvider } from '@/lib/query-provider';
import { MeshGradient } from '@/components/layout/mesh-gradient';
import { AuthInit } from '@/lib/auth/auth-init';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthInit />
        <MeshGradient />
        {children}
        <Toaster
          position="bottom-center"
          gap={8}
          toastOptions={{
            classNames: {
              toast:
                'bg-card/95 backdrop-blur-lg border border-border/60 text-card-foreground shadow-xl rounded-xl !px-4 !py-3',
              title: 'text-sm font-medium',
              description: 'text-xs text-muted-foreground',
              success:
                'border-l-[3px] !border-l-success',
              error:
                'border-l-[3px] !border-l-destructive',
              info:
                'border-l-[3px] !border-l-info',
              warning:
                'border-l-[3px] !border-l-warning',
              closeButton:
                'text-muted-foreground hover:text-foreground',
            },
            duration: 2500,
          }}
        />
      </ThemeProvider>
    </QueryProvider>
  );
}
