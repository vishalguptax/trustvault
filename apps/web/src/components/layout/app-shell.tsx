'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Sun, Moon, List, CaretLeft, SquaresFour, Plus, File, FileText,
  CheckCircle, Shield, Users, UserPlus, SignOut, FileArrowUp, QrCode,
} from '@phosphor-icons/react';
import { TrustiLockLogo } from '@/components/ui/trustilock-logo';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';
import { useAuthStore } from '@/lib/auth/auth-store';
import { PageTransition } from './page-transition';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  role: 'issuer' | 'verifier' | 'admin';
  children: React.ReactNode;
}

const roleConfig = {
  issuer: {
    label: 'Issuer Portal',
    accent: 'text-primary',
    nav: [
      { label: 'Dashboard', href: '/issuer', icon: <SquaresFour size={20} /> },
      { label: 'New Offer', href: '/issuer/offers/new', icon: <Plus size={20} /> },
      { label: 'Bulk Issue', href: '/issuer/offers/batch', icon: <FileArrowUp size={20} /> },
      { label: 'Offers', href: '/issuer/offers', icon: <QrCode size={20} /> },
      { label: 'Credentials', href: '/issuer/credentials', icon: <File size={20} /> },
      { label: 'Schemas', href: '/issuer/schemas', icon: <FileText size={20} /> },
    ],
  },
  verifier: {
    label: 'Verifier Portal',
    accent: 'text-info',
    nav: [
      { label: 'Dashboard', href: '/verifier', icon: <SquaresFour size={20} /> },
      { label: 'New Request', href: '/verifier/requests/new', icon: <Plus size={20} /> },
      { label: 'Results', href: '/verifier/results', icon: <CheckCircle size={20} /> },
      { label: 'Policies', href: '/verifier/policies', icon: <Shield size={20} /> },
    ],
  },
  admin: {
    label: 'Trust Admin',
    accent: 'text-warning',
    nav: [
      { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
      { label: 'Trust Registry', href: '/admin/issuers', icon: <Shield size={20} /> },
      { label: 'Onboard', href: '/admin/onboard', icon: <UserPlus size={20} /> },
      { label: 'Schemas', href: '/admin/schemas', icon: <FileText size={20} /> },
    ],
  },
};

export function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const config = roleConfig[role];

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'glass-sidebar flex flex-col transition-all duration-300',
          'fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-16' : 'w-60'
        )}
        role="navigation"
        aria-label={`${config.label} navigation`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrustiLockLogo size={20} className="text-primary" />
            </div>
            {!collapsed && (
              <span className="text-foreground font-semibold text-sm whitespace-nowrap">
                TrustiLock
              </span>
            )}
          </Link>
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <span className={cn('text-xs font-medium', config.accent)}>
              {config.label}
            </span>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 py-2 px-2 space-y-1">
          {config.nav.map((item) => {
            const isActive =
              item.href === `/${role}`
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 w-full rounded-none text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <CaretLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-[1]" aria-label={`${config.label} content`}>
        {/* Header */}
        <header className="h-14 glass-header flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden"
              aria-label="Toggle navigation"
            >
              <List size={20} />
            </Button>
            <h1 className="text-lg font-semibold">{getPageTitle(pathname)}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            {user && (
              <>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
                <div className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', getRoleBadgeClass(role))}>
                  {role === 'admin' ? 'Admin' : role === 'issuer' ? 'Issuer' : 'Verifier'}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Sign out"
                >
                  <SignOut size={18} />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-5 md:p-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return 'Dashboard';
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'issuer': return 'bg-primary/10 text-primary';
    case 'verifier': return 'bg-info/10 text-info';
    case 'admin': return 'bg-warning/10 text-warning';
    default: return 'bg-muted text-muted-foreground';
  }
}

