'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Sun, Moon, MagnifyingGlass, Gear, Certificate, ArrowRight } from '@phosphor-icons/react';
import { TrustiLockLogo } from '@/components/ui/trustilock-logo';
import { useTheme } from '@/components/layout/theme-provider';
import { useAuthStore, ROLE_REDIRECTS } from '@/lib/auth/auth-store';
import { Button } from '@/components/ui/button';

const portals = [
  {
    title: 'Issuer Portal',
    description: 'Create credential offers, issue verifiable credentials, and manage revocations.',
    href: '/issuer',
    icon: <Certificate size={28} weight="duotone" />,
    iconBg: 'bg-primary/10 text-primary ring-primary/20',
    hoverBorder: 'hover:border-primary/40',
    hoverShadow: 'hover:shadow-primary/5',
  },
  {
    title: 'Verifier Portal',
    description: 'Create verification requests, validate presentations, and view results.',
    href: '/verifier',
    icon: <MagnifyingGlass size={28} weight="duotone" />,
    iconBg: 'bg-info/10 text-info ring-info/20',
    hoverBorder: 'hover:border-info/40',
    hoverShadow: 'hover:shadow-info/5',
  },
  {
    title: 'Trust Admin',
    description: 'Manage users, trusted issuers, credential schemas, and verification policies.',
    href: '/admin',
    icon: <Gear size={28} weight="duotone" />,
    iconBg: 'bg-warning/10 text-warning ring-warning/20',
    hoverBorder: 'hover:border-warning/40',
    hoverShadow: 'hover:shadow-warning/5',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center ring-1 ring-primary/20">
            <TrustiLockLogo size={22} className="text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">TrustiLock</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {isAuthenticated && user ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={ROLE_REDIRECTS[user.role] || '/'}>
                Go to {user.role === 'holder' ? 'Home' : user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
              </Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6 pt-8 pb-12"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-primary/25 to-primary/5 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-primary/15"
        >
          <TrustiLockLogo size={36} className="text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center tracking-tighter mb-4"
        >
          Portable Proofs.{' '}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Instant Trust.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-muted-foreground text-lg md:text-xl text-center max-w-2xl mb-12 leading-relaxed"
        >
          Issue, store, and verify credentials with cryptographic guarantees.
          Built on open standards — OID4VCI, OID4VP, SD-JWT-VC.
        </motion.p>

        {/* Portal Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full"
        >
          {portals.map((portal) => (
            <motion.div key={portal.title} variants={itemVariants} className="h-full">
              <Link href={portal.href} className="block h-full group">
                <div
                  className={`glass-card rounded-2xl p-6 transition-all duration-300 h-full group-hover:shadow-[var(--shadow-card-hover)] group-hover:-translate-y-1 ${portal.hoverBorder}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 transition-all duration-300 group-hover:ring-2 ${portal.iconBg}`}>
                    {portal.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-tight">{portal.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {portal.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Open portal <ArrowRight size={14} weight="bold" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Download Wallet */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 border-t border-border/60 py-12 px-4 md:px-6"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3 tracking-tight">TrustiLock Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Download Expo Go on your phone and scan the QR code from the development server
            to run the TrustiLock mobile wallet.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="glass-card rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
              iOS: App Store → Expo Go
            </div>
            <div className="glass-card rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
              Android: Play Store → Expo Go
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-6 px-4 md:px-6 text-center text-sm">
        <p className="text-muted-foreground">TrustiLock — Verifiable Credential Ecosystem Prototype</p>
        <p className="text-muted-foreground/70 mt-2">
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/sandhya-sharmaaa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            Sandhya Sharma
          </a>
        </p>
      </footer>
    </div>
  );
}
