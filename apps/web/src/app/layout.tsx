import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AuthInit } from '@/lib/auth/auth-init';

export const metadata: Metadata = {
  title: 'TrustVault — Verifiable Credential Platform',
  description:
    'Portable Proofs. Instant Trust. Issue, store, and verify credentials with TrustVault.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthInit />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: 'bg-card border-border text-card-foreground',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
