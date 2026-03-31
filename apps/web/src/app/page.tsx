'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Sun, Moon, ShieldCheck, MagnifyingGlass, Gear, Certificate } from '@phosphor-icons/react';
import { useTheme } from '@/components/layout/theme-provider';
import { useAuthStore, ROLE_REDIRECTS } from '@/lib/auth/auth-store';
import { Button } from '@/components/ui/button';

const portals = [
  {
    title: 'Issuer Portal',
    description: 'Create credential offers, issue verifiable credentials, manage revocations.',
    href: '/issuer',
    icon: <Certificate size={32} weight="duotone" />,
    iconBg: 'bg-primary/10 text-primary',
    borderAccent: 'hover:border-primary/50',
  },
  {
    title: 'Verifier Portal',
    description: 'Create verification requests, validate presentations, view results.',
    href: '/verifier',
    icon: <MagnifyingGlass size={32} weight="duotone" />,
    iconBg: 'bg-info/10 text-info',
    borderAccent: 'hover:border-info/50',
  },
  {
    title: 'Trust Admin',
    description: 'Manage trusted issuers, credential schemas, and verification policies.',
    href: '/admin',
    icon: <Gear size={32} weight="duotone" />,
    iconBg: 'bg-warning/10 text-warning',
    borderAccent: 'hover:border-warning/50',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} className="text-primary" weight="fill" />
          </div>
          <span className="font-semibold text-sm">TrustVault</span>
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pt-8 pb-12"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20"
        >
          <ShieldCheck size={32} className="text-primary" weight="fill" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-center tracking-tight mb-4"
        >
          Portable Proofs.{' '}
          <span className="text-primary">Instant Trust.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-muted-foreground text-lg md:text-xl text-center max-w-2xl mb-12"
        >
          Issue, store, and verify credentials with cryptographic guarantees.
          Built on open standards — OID4VCI, OID4VP, SD-JWT-VC.
        </motion.p>

        {/* Portal Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {portals.map((portal) => (
            <motion.div key={portal.title} variants={itemVariants} className="h-full">
              <Link href={portal.href} className="block h-full">
                <div
                  className={`group bg-card border border-border rounded-xl p-6 transition-all duration-300 h-full ${portal.borderAccent} hover:shadow-lg hover:shadow-black/5`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${portal.iconBg}`}
                  >
                    {portal.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{portal.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {portal.description}
                  </p>
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
        className="border-t border-border py-12 px-4 md:px-6"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3">TrustVault Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Download Expo Go on your phone and scan the QR code from the development server
            to run the TrustVault mobile wallet.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground">
              iOS: App Store → Expo Go
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground">
              Android: Play Store → Expo Go
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 md:px-6 text-center text-muted-foreground text-sm">
        TrustVault — Verifiable Credential Ecosystem Prototype
      </footer>
    </div>
  );
}
