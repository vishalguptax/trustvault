import { AppShell } from '@/components/layout/app-shell';

export default function VerifierLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="verifier">{children}</AppShell>;
}
