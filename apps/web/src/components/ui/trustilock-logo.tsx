import { ShieldCheck } from '@phosphor-icons/react';

interface TrustiLockLogoProps {
  size?: number;
  className?: string;
}

export function TrustiLockLogo({ size = 20, className }: TrustiLockLogoProps) {
  return <ShieldCheck size={size} className={className} weight="fill" />;
}
