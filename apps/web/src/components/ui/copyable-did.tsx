'use client';

import { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import { truncateDid } from '@/lib/utils';

interface CopyableDidProps {
  did: string;
  className?: string;
}

export function CopyableDid({ did, className }: CopyableDidProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(did);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={handleCopy}
      className={`group inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors ${className ?? ''}`}
      title={did}
      aria-label={`Copy DID: ${did}`}
    >
      <span>{truncateDid(did)}</span>
      {copied ? (
        <Check size={12} className="text-success" />
      ) : (
        <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
