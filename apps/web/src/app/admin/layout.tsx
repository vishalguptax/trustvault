import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/lib/auth/auth-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppShell role="admin">{children}</AppShell>
    </AuthGuard>
  );
}
