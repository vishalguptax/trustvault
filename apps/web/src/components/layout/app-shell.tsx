'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PageTransition } from './page-transition';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface AppShellProps {
  role: 'issuer' | 'verifier' | 'admin';
  children: React.ReactNode;
}

const roleConfig = {
  issuer: {
    label: 'Issuer Portal',
    accent: 'text-primary',
    nav: [
      { label: 'Dashboard', href: '/issuer', icon: <DashboardIcon /> },
      { label: 'New Offer', href: '/issuer/offers/new', icon: <PlusIcon /> },
      { label: 'Credentials', href: '/issuer/credentials', icon: <CredentialIcon /> },
      { label: 'Schemas', href: '/issuer/schemas', icon: <SchemaIcon /> },
    ],
  },
  verifier: {
    label: 'Verifier Portal',
    accent: 'text-info',
    nav: [
      { label: 'Dashboard', href: '/verifier', icon: <DashboardIcon /> },
      { label: 'New Request', href: '/verifier/requests/new', icon: <PlusIcon /> },
      { label: 'Results', href: '/verifier/results', icon: <ResultIcon /> },
      { label: 'Policies', href: '/verifier/policies', icon: <PolicyIcon /> },
    ],
  },
  admin: {
    label: 'Trust Admin',
    accent: 'text-warning',
    nav: [
      { label: 'Issuers', href: '/admin/issuers', icon: <IssuerIcon /> },
      { label: 'Schemas', href: '/admin/schemas', icon: <SchemaIcon /> },
    ],
  },
};

export function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = roleConfig[role];

  return (
    <div className="flex h-screen overflow-hidden">
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
          'bg-card border-r border-border flex flex-col transition-all duration-300',
          'fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-16' : 'w-60'
        )}
        role="navigation"
        aria-label={`${config.label} navigation`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm font-bold">TV</span>
            </div>
            {!collapsed && (
              <span className="text-foreground font-semibold text-sm whitespace-nowrap">
                TrustVault
              </span>
            )}
          </Link>
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-border">
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive
                    ? 'bg-primary/10 text-primary'
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 256 256"
            className={cn('transition-transform', collapsed && 'rotate-180')}
          >
            <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" aria-label={`${config.label} content`}>
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle navigation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">{getPageTitle(pathname)}</h1>
          </div>
          <div className={cn('text-xs font-medium px-2 py-1 rounded-full', getRoleBadgeClass(role))}>
            {config.label}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
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

/* Inline SVG icons for nav items */
function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM120,176H56V120h64Zm0-80H56V56h64Zm80,80H136V56h64Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
    </svg>
  );
}

function CredentialIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM96,48h64a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16Zm88,160H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-48H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z" />
    </svg>
  );
}

function SchemaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm-8,24H88a8,8,0,0,0,0,16h80a8,8,0,0,0,0-16ZM216,40V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V40A16,16,0,0,1,56,24h48a8,8,0,0,1,0,16H56V216H200V40H152a8,8,0,0,1,0-16h48A16,16,0,0,1,216,40Z" />
    </svg>
  );
}

function ResultIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
    </svg>
  );
}

function PolicyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.62,75.82,119.34,91,124.38a15.44,15.44,0,0,0,10,0c15.2-5.05,91-34.77,91-124.39V56A16,16,0,0,0,208,40Zm0,74.79c0,78-63.33,104.29-80,110.07-16.67-5.78-80-32.06-80-110.08V56H208Z" />
    </svg>
  );
}

function IssuerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.6-28.5,8,8,0,1,1-15.7-3A40,40,0,1,1,212,128a67.88,67.88,0,0,1,34.4,21.6A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176Z" />
    </svg>
  );
}
