'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
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
        throw new Error(data.error || '登录失败');
      }

      // Redirect to admin dashboard - use window.location for full page refresh
      window.location.href = '/admin/library';
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] md:min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[var(--ds-accent-5)] to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[var(--ds-luxury-5)] to-transparent dark:from-[var(--ds-luxury-8)] blur-3xl" />

      <div className="relative max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-3 tracking-tighter">
            CCFrame
          </h1>
          <div className="inline-block">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
              管理后台
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-[color:var(--ds-accent-10)] border-2 border-[color:var(--ds-accent-20)]">
                <p className="text-sm font-medium text-[color:var(--ds-accent)]">{error}</p>
              </div>
            )}

            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
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
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-center text-xs tracking-widest text-[color:var(--ds-muted-soft)]">
          受保护区域 - 仅授权用户可访问
        </p>
      </div>
    </div>
  );
}
