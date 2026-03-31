import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/lib/auth/auth-guard';

export default function IssuerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['issuer', 'admin']}>
      <AppShell role="issuer">{children}</AppShell>
    </AuthGuard>
  );
}
