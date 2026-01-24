'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setEmail(data.user.email);
        } else if (response.status === 401) {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || email === user?.email) {
      setMessage({ type: 'error', text: '请输入新的邮箱地址' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setMessage({ type: 'success', text: '邮箱更新成功！' });
      } else {
        setMessage({ type: 'error', text: data.error || '更新失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      setMessage({ type: 'error', text: '请输入当前密码' });
      return;
    }

    if (!newPassword) {
      setMessage({ type: 'error', text: '请输入新密码' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: '新密码至少需要8个字符' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '密码更新成功！' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || '更新失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[color:var(--ds-accent)]" />
            <span className="text-sm tracking-widest text-stone-600 dark:text-stone-400 font-light">
              加载中
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="inline-block mb-3">
          <span className="text-xs tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
            账户
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
          账户设置
        </h1>
        <p className="text-stone-600 dark:text-stone-400 font-light">
          管理您的账户信息和安全设置
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-2xl ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Account Info */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6">
            账户信息
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-3 border-b border-stone-100 dark:border-neutral-800">
              <span className="text-stone-500 dark:text-stone-400">用户ID</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">{user?.id}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-stone-100 dark:border-neutral-800">
              <span className="text-stone-500 dark:text-stone-400">创建时间</span>
              <span className="text-stone-700 dark:text-stone-300">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Update Email */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6">
            修改邮箱
          </h2>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <Input
              label="邮箱地址"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                更新邮箱
              </Button>
            </div>
          </form>
        </div>

        {/* Update Password */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6">
            修改密码
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="当前密码"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="输入当前密码"
              autoComplete="current-password"
            />
            <Input
              label="新密码"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少8个字符"
              autoComplete="new-password"
            />
            <Input
              label="确认新密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              autoComplete="new-password"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                更新密码
              </Button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="bg-stone-50 dark:bg-neutral-800/50 rounded-3xl p-8">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">
            🔒 安全提示
          </h3>
          <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li>• 密码应至少包含8个字符</li>
            <li>• 建议使用字母、数字和特殊字符的组合</li>
            <li>• 请勿与其他网站使用相同的密码</li>
            <li>• 定期更换密码以提高安全性</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
