'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
  PhotoIcon,
  UploadIcon,
  FolderIcon,
  CollectionIcon,
  TagIcon,
  SettingsIcon,
  ChartIcon,
  UserIcon,
  HomeIcon,
  MoreIcon,
} from '@/components/ui/Icons';

// Haptic feedback for navigation actions
const triggerHaptic = (duration = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

const primaryNavItems = [
  {
    href: '/admin/library',
    label: '照片',
    Icon: PhotoIcon,
  },
  {
    href: '/admin/upload',
    label: '上传',
    Icon: UploadIcon,
  },
  {
    href: '/admin/albums',
    label: '相册',
    Icon: FolderIcon,
  },
];

const moreNavItems = [
  { href: '/admin/series', label: '系列', Icon: CollectionIcon },
  { href: '/admin/tags', label: '标签', Icon: TagIcon },
  { href: '/admin/settings', label: '设置', Icon: SettingsIcon },
  { href: '/admin/analytics', label: '统计', Icon: ChartIcon },
  { href: '/admin/account', label: '账户', Icon: UserIcon },
  { href: '/', label: '前台', Icon: HomeIcon },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  // Hide on login page
  if (pathname === '/admin/login') {
    return null;
  }

  const isMoreActive = moreNavItems.some(item => pathname === item.href);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu sheet */}
      <div
        className={`md:hidden fixed bottom-[4.5rem] left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out supports-[padding:env(safe-area-inset-bottom)]:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] ${
          showMore ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4">
          <div className="w-10 h-1 bg-stone-300 dark:bg-neutral-700 rounded-full mx-auto mb-4" />
          <div className="grid grid-cols-3 gap-2">
            {moreNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  triggerHaptic(8);
                  setShowMore(false);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 active:scale-95 ${
                  pathname === item.href
                    ? 'bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800'
                }`}
              >
                <item.Icon size={24} filled={pathname === item.href} className="mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border-t border-stone-200/50 dark:border-neutral-800/50 supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[4.5rem] px-2">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => triggerHaptic(6)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-[color:var(--ds-accent)]'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <item.Icon size={24} filled={isActive} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[color:var(--ds-accent)]" />
                  )}
                </div>
                <span className={`mt-1 text-[10px] font-medium tracking-wide ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => {
              triggerHaptic(10);
              setShowMore(!showMore);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 active:scale-95 ${
              showMore || isMoreActive
                ? 'text-[color:var(--ds-accent)]'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <div className={`relative transition-transform duration-200 ${showMore ? 'scale-110' : ''}`}>
              <MoreIcon size={24} filled={showMore || isMoreActive} />
              {isMoreActive && !showMore && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[color:var(--ds-accent)]" />
              )}
            </div>
            <span className={`mt-1 text-[10px] font-medium tracking-wide ${
              showMore || isMoreActive ? 'opacity-100' : 'opacity-70'
            }`}>
              更多
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
