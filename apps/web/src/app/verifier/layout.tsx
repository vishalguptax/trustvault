import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/lib/auth/auth-guard';

export default function VerifierLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['verifier', 'admin']}>
      <AppShell role="verifier">{children}</AppShell>
    </AuthGuard>
  );
}
