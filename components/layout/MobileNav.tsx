'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  HomeIcon,
  PhotoIcon,
  TagIcon,
  CollectionIcon,
  SunIcon,
  MoonIcon,
} from '@/components/ui/Icons';

// Haptic feedback for navigation actions
const triggerHaptic = (duration = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

const navItems = [
  {
    href: '/',
    label: '首页',
    Icon: HomeIcon,
  },
  {
    href: '/photos',
    label: '作品',
    Icon: PhotoIcon,
  },
  {
    href: '/tags',
    label: '标签',
    Icon: TagIcon,
  },
  {
    href: '/series',
    label: '系列',
    Icon: CollectionIcon,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 同步当前主题状态
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // 监听主题变化
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    triggerHaptic(8);
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  }, [isDark]);

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-stone-50/95 dark:bg-neutral-950/95 backdrop-blur-2xl border-t border-stone-200/30 dark:border-neutral-800/30 supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around h-[4.25rem] px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic(6)}
              className={`group relative flex flex-col items-center justify-center flex-1 h-full py-1.5 touch-manipulation select-none transition-all duration-200 active:scale-[0.92] active:opacity-70 ${
                isActive
                  ? 'text-[color:var(--ds-accent)]'
                  : 'text-[color:var(--ds-muted-soft)] active:text-[color:var(--ds-muted)]'
              }`}
            >
              {/* 触摸反馈背景 */}
              <div className={`absolute inset-x-2 inset-y-1 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-[color:var(--ds-accent-10)]' 
                  : 'bg-transparent group-active:bg-stone-200/60 dark:group-active:bg-neutral-800/60'
              }`} />
              
              <div className={`relative z-10 transition-transform duration-300 ease-out ${isActive ? 'scale-110 -translate-y-0.5' : 'group-active:scale-95'}`}>
                <item.Icon size={22} filled={isActive} />
              </div>
              
              <span className={`relative z-10 mt-0.5 text-[10px] font-medium tracking-wide transition-all duration-200 ${
                isActive ? 'opacity-100 font-semibold' : 'opacity-60 group-active:opacity-100'
              }`}>
                {item.label}
              </span>
              
              {/* 活跃指示器 */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[color:var(--ds-accent)] shadow-[0_0_8px_var(--ds-accent-50)]" />
              )}
            </Link>
          );
        })}
        
        {/* 明暗模式切换按钮 */}
        <button
          onClick={toggleTheme}
          className="group relative flex flex-col items-center justify-center flex-1 h-full py-1.5 touch-manipulation select-none transition-all duration-200 active:scale-[0.92] active:opacity-70 text-[color:var(--ds-muted-soft)]"
          aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {/* 触摸反馈背景 */}
          <div className="absolute inset-x-2 inset-y-1 rounded-2xl transition-all duration-200 bg-transparent group-active:bg-stone-200/60 dark:group-active:bg-neutral-800/60" />
          
          <div className="relative z-10 w-[22px] h-[22px] transition-transform duration-300 ease-out group-active:scale-95">
            {/* 太阳图标 */}
            <span className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}>
              <SunIcon size={22} />
            </span>
            {/* 月亮图标 */}
            <span className={`absolute inset-0 transition-all duration-300 ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
              <MoonIcon size={22} />
            </span>
          </div>
          
          <span className="relative z-10 mt-0.5 text-[10px] font-medium tracking-wide opacity-60 group-active:opacity-100 transition-all duration-200">
            {isDark ? '浅色' : '深色'}
          </span>
        </button>
      </div>
    </nav>
  );
}
