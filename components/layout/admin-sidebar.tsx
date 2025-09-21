"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  adminPrimaryNavigation,
  adminSecondaryNavigation,
  isNavigationActive,
} from '@/lib/config/navigation'
import { cn } from '@/lib/utils'

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-8">
      <div className="space-y-2">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Primary</p>
        <ul className="space-y-1">
          {adminPrimaryNavigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isNavigationActive(pathname, item)
                    ? 'bg-primary/10 text-primary shadow-soft'
                    : 'text-text-secondary hover:bg-surface-panel/80 hover:text-text-primary',
                )}
              >
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {adminSecondaryNavigation.map((group) => (
        <div key={group.title ?? 'secondary'} className="space-y-2">
          {group.title ? (
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {group.title}
            </p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isNavigationActive(pathname, item)
                      ? 'bg-primary/10 text-primary shadow-soft'
                      : 'text-text-secondary hover:bg-surface-panel/80 hover:text-text-primary',
                  )}
                >
                  {item.icon ? <item.icon className="h-4 w-4" /> : null}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
