import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/layout/providers';

export const metadata: Metadata = {
  title: 'TrustiLock — Verifiable Credential Platform',
  description:
    'Portable Proofs. Instant Trust. Issue, store, and verify credentials with TrustiLock.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
