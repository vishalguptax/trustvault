'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Envelope, Sun, Moon } from '@phosphor-icons/react';
import { TrustiLockLogo } from '@/components/ui/trustilock-logo';
import { useAuthStore, ROLE_REDIRECTS } from '@/lib/auth/auth-store';
import { useTheme } from '@/components/layout/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      const user = useAuthStore.getState().user;
      router.replace(ROLE_REDIRECTS[user?.role ?? 'holder'] || '/');
    }
  }, [isAuthenticated, router]);

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      router.push(ROLE_REDIRECTS[user.role] || '/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center ring-1 ring-primary/20">
            <TrustiLockLogo size={22} className="text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">TrustiLock</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm glass-card rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-5">
            <TrustiLockLogo size={30} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-2">Sign in to your TrustiLock account</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Envelope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-9"
                autoComplete="email"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Min 8 characters"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full cursor-pointer" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Contact your administrator for account access.
        </p>
      </div>
      </div>
    </div>
  );
}
