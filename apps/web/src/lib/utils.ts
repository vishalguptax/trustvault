import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateDid(did: string, chars: number = 16): string {
  if (did.length <= chars + 6) return did;
  return `${did.slice(0, chars)}...${did.slice(-4)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function getCredentialAccentClass(type: string): string {
  if (type.includes('Education')) return 'credential-education';
  if (type.includes('Income')) return 'credential-income';
  if (type.includes('Identity')) return 'credential-identity';
  return 'primary';
}
