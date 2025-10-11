'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/library', label: '照片库' },
    { href: '/admin/upload', label: '上传' },
    { href: '/admin/albums', label: '相册' },
    { href: '/admin/series', label: '系列' },
    { href: '/admin/tags', label: '标签' },
    { href: '/admin/settings', label: '设置' },
    { href: '/admin/analytics', label: '统计' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-stone-200/50 dark:border-neutral-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-10">
            {/* Brand */}
            <Link href="/" className="group flex items-center space-x-3">
              <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tighter group-hover:text-[#e63946] dark:group-hover:text-[#ff6b7a] transition-colors duration-300">
                CCFrame
              </span>
              <span className="text-xs uppercase tracking-[0.15em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
                Admin
              </span>
            </Link>

            {/* Nav Items */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 ${
                    pathname === item.href
                      ? 'bg-[#e63946]/10 dark:bg-[#ff6b7a]/10 text-[#e63946] dark:text-[#ff6b7a] ring-1 ring-[#e63946]/20 dark:ring-[#ff6b7a]/20'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 text-sm font-medium tracking-wide text-[#e63946] dark:text-[#ff6b7a] hover:bg-[#e63946]/10 dark:hover:bg-[#ff6b7a]/10 rounded-xl transition-all duration-300 hover:ring-1 hover:ring-[#e63946]/20 dark:hover:ring-[#ff6b7a]/20"
          >
            登出
          </button>
        </div>
      </div>
    </nav>
  );
}
