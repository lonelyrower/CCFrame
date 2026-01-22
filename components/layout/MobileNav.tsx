'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PhotoIcon,
  TagIcon,
  CollectionIcon,
} from '@/components/ui/Icons';

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

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-stone-50/80 dark:bg-neutral-950/80 backdrop-blur-xl border-t border-stone-200/50 dark:border-neutral-800/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
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
      </div>
    </nav>
  );
}
