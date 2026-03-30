'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const portals = [
  {
    title: 'Issuer Portal',
    description: 'Create credential offers, issue verifiable credentials, manage revocations.',
    href: '/issuer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
        <path d="M225.86,48.81A16,16,0,0,0,210.52,41L55.77,70.62A16,16,0,0,0,43.14,81.55l-18.57,66A16.07,16.07,0,0,0,35.2,165.4l155.25,58.57A16.07,16.07,0,0,0,208.37,212l46.62-147.73A16,16,0,0,0,225.86,48.81ZM138,152a14,14,0,1,1,14-14A14,14,0,0,1,138,152Z" />
      </svg>
    ),
    accent: 'from-teal-500/20 to-emerald-500/20',
    borderAccent: 'hover:border-teal-500/50',
  },
  {
    title: 'Verifier Portal',
    description: 'Create verification requests, validate presentations, view results.',
    href: '/verifier',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
      </svg>
    ),
    accent: 'from-blue-500/20 to-indigo-500/20',
    borderAccent: 'hover:border-blue-500/50',
  },
  {
    title: 'Trust Admin',
    description: 'Manage trusted issuers, credential schemas, and verification policies.',
    href: '/admin',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
        <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,42.89,97.88,25a8,8,0,0,0-6.47-.6A112,112,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.63a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,213.11,158.12,231a8,8,0,0,0,6.47.6,112,112,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21Z" />
      </svg>
    ),
    accent: 'from-amber-500/20 to-orange-500/20',
    borderAccent: 'hover:border-amber-500/50',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pt-20 pb-12"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="hsl(174 58% 40%)" viewBox="0 0 256 256">
            <path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40ZM128,152a40,40,0,1,1,40-40A40,40,0,0,1,128,152Z" />
          </svg>
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
            <motion.div key={portal.title} variants={itemVariants}>
              <Link href={portal.href}>
                <div
                  className={`group bg-card border border-border rounded-xl p-6 transition-all duration-300 ${portal.borderAccent} hover:shadow-lg hover:shadow-primary/5`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${portal.accent} flex items-center justify-center mb-4 text-foreground`}
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
