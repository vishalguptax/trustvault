import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Toaster } from 'sonner';

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(220 26% 9%)',
              border: '1px solid hsl(217 19% 17%)',
              color: 'hsl(210 20% 98%)',
            },
          }}
        />
      </body>
    </html>
  );
}
