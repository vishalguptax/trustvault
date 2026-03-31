'use client';

import { useEffect } from 'react';
import { useAuthStore } from './auth-store';

/** Mount once in the root layout to restore auth session on page load. */
export function AuthInit() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return null;
}
