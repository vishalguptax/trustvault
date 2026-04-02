'use client';

import { useEffect } from 'react';
import { useAuthStore } from './auth-store';
import { wakeUpApi } from '@/lib/api/client';

/** Mount once in the root layout to restore auth session and wake the API. */
export function AuthInit() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
    // Wake up the API server (cold start on free tier hosting)
    wakeUpApi();
  }, [init]);

  return null;
}
