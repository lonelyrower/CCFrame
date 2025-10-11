'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to admin dashboard
      router.push('/admin/library');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#e63946]/5 to-transparent dark:from-[#ff6b7a]/8 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[#d4af37]/5 to-transparent dark:from-[#d4af37]/8 blur-3xl" />

      <div className="relative max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-3 tracking-tighter">
            CCFrame
          </h1>
          <div className="inline-block">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-[#e63946]/10 dark:bg-[#ff6b7a]/10 border-2 border-[#e63946]/20 dark:border-[#ff6b7a]/20">
                <p className="text-sm font-medium text-[#e63946] dark:text-[#ff6b7a]">{error}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-center text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
          Protected Area · Authorized Access Only
        </p>
      </div>
    </div>
  );
}
