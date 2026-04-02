'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Copy, Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QRDisplayProps {
  value: string;
  size?: number;
  label?: string;
  waiting?: boolean;
  className?: string;
}

export function QRDisplay({ value, size = 256, label, waiting = false, className }: QRDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('URI copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URI');
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}

      <motion.div
        className="bg-white rounded-2xl p-6 shadow-lg"
        animate={waiting ? {
          scale: [1, 1.02, 1],
          boxShadow: [
            '0 10px 15px -3px rgba(0,0,0,0.1)',
            '0 10px 25px -3px rgba(20,184,166,0.2)',
            '0 10px 15px -3px rgba(0,0,0,0.1)',
          ],
        } : {}}
        transition={waiting ? {
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        } : {}}
      >
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#1A2B1A"
        />
      </motion.div>

      <div className="flex items-center gap-2 max-w-sm w-full">
        <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 font-mono text-xs text-muted-foreground truncate">
          {value}
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'URI copied' : 'Copy URI to clipboard'}
          className={cn(
            'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            copied
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-card text-foreground border-border hover:bg-muted'
          )}
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <Check size={14} />
              Copied
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy size={14} />
              Copy
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
