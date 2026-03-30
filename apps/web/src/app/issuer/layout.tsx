import { AppShell } from '@/components/layout/app-shell';

export default function IssuerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="issuer">{children}</AppShell>;
}
