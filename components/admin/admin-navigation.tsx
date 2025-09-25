"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  adminNavigationSections,
  adminSupportLinks,
  formatNavigationBadge,
  type AdminNavigationBadge,
  type AdminNavigationItem,
  type AdminNavigationMetrics,
} from '@/lib/admin/navigation-registry'
import { cn } from '@/lib/utils'
import { useAdminNavigationMetrics } from './use-admin-navigation-metrics'

interface AdminNavigationSidebarProps {
  className?: string
}

export function AdminNavigationSidebar({ className }: AdminNavigationSidebarProps) {
  const metrics = useAdminNavigationMetrics()
  const pathname = usePathname()

  return (
    <div className={cn('relative hidden lg:flex', className)}>
      {/* Film grain background */}
      <div
        className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />

      <nav className="relative flex flex-col gap-8" aria-label="后台主要导航">
        {adminNavigationSections.map((section) => (
          <SectionBlock
            key={section.id}
            title={section.title}
            pathname={pathname}
            metrics={metrics}
            items={section.items}
          />
        ))}

        <SectionBlock
          title={adminSupportLinks.title}
          pathname={pathname}
          metrics={metrics}
          items={adminSupportLinks.items}
        />
      </nav>
    </div>
  )
}

interface SectionBlockProps {
  title?: string
  pathname: string
  metrics: AdminNavigationMetrics
  items: AdminNavigationItem[]
}

function SectionBlock({ title, pathname, metrics, items }: SectionBlockProps) {
  return (
    <div className="space-y-3">
      {title ? (
        <p className="px-3 text-xs font-medium uppercase tracking-[0.15em] text-text-muted dark:text-white/50">{title}</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const badge = formatNavigationBadge(item, metrics)
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(`${item.href}/`))

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-sm font-light transition-all duration-300',
                  isActive
                    ? 'border border-amber-200/40 bg-amber-100/10 text-amber-700 shadow-lg backdrop-blur-xl scale-105 dark:text-amber-100'
                    : [
                        'text-text-secondary hover:border hover:border-surface-outline/50 hover:bg-surface-panel/80 hover:text-text-primary hover:scale-105 hover:backdrop-blur-xl',
                        'dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white',
                      ],
                )}
                style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {Icon ? (
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-amber-600 dark:text-amber-200'
                          : 'text-text-muted group-hover:text-amber-500 dark:text-white/50 dark:group-hover:text-amber-200'
                      )}
                    />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </span>
                {badge ? <BadgePill badge={badge} /> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface BadgePillProps {
  badge: AdminNavigationBadge
}

function BadgePill({ badge }: BadgePillProps) {
  const toneClass = getBadgeToneClass(badge.tone)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-[8px] border px-2 py-1 text-[10px] font-medium tracking-wide',
        toneClass,
      )}
    >
      {badge.label}
    </span>
  )
}

type BadgeTone = AdminNavigationBadge['tone']

function getBadgeToneClass(tone: BadgeTone) {
  switch (tone) {
    case 'danger':
      return 'border-red-400/50 bg-red-500/10 text-red-600 dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-100'
    case 'warning':
      return 'border-amber-200/50 bg-amber-100/15 text-amber-700 dark:border-amber-200/40 dark:bg-amber-100/20 dark:text-amber-100'
    case 'success':
      return 'border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100'
    case 'info':
      return 'border-blue-400/50 bg-blue-500/10 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-100'
    case 'neutral':
    default:
      return 'border-surface-outline/40 bg-surface-panel/70 text-text-secondary dark:border-white/30 dark:bg-white/10 dark:text-white/80'
  }
}

export function AdminNavigationMobileToggle() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const metrics = useAdminNavigationMetrics()

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-surface-outline/50 bg-surface-panel/80 text-text-primary backdrop-blur-xl transition-all duration-300 hover:border-primary hover:bg-surface-panel/90 hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:border-amber-200/40 dark:hover:bg-amber-100/10 dark:hover:text-amber-100"
        aria-expanded={open}
        aria-label={open ? '关闭后台导航' : '打开后台导航'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.25, 0.25, 1] }}
            className="fixed inset-x-4 top-[5rem] z-40 overflow-hidden rounded-[24px] border border-surface-outline/50 bg-surface-canvas/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-black/80"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(15,15,15,0.95) 100%)'
            }}
          >
            <nav aria-label="后台导航（移动）" className="space-y-6">
              {adminNavigationSections.map((section) => (
                <MobileSection
                  key={section.id}
                  title={section.title}
                  pathname={pathname}
                  metrics={metrics}
                  items={section.items}
                  onNavigate={() => setOpen(false)}
                />
              ))}

              <MobileSection
                title={adminSupportLinks.title}
                pathname={pathname}
                metrics={metrics}
                items={adminSupportLinks.items}
                onNavigate={() => setOpen(false)}
              />
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {open ? (
        <button
          type="button"
          aria-hidden="true"
          className="fixed inset-0 z-30 h-full w-full bg-surface-outline/20"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

interface MobileSectionProps {
  title?: string
  pathname: string
  metrics: AdminNavigationMetrics
  items: AdminNavigationItem[]
  onNavigate: () => void
}

function MobileSection({ title, pathname, metrics, items, onNavigate }: MobileSectionProps) {
  return (
    <div className="space-y-3">
      {title ? (
        <p className="px-3 text-xs font-medium uppercase tracking-[0.15em] text-text-muted dark:text-white/50">{title}</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const badge = formatNavigationBadge(item, metrics)
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(`${item.href}/`))

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center justify-between rounded-[16px] px-4 py-3 text-sm font-light transition-all duration-300',
                  isActive
                    ? 'border border-amber-200/40 bg-amber-100/10 text-amber-700 shadow-lg backdrop-blur-xl dark:text-amber-100'
                    : [
                        'border border-transparent text-text-secondary hover:border-surface-outline/50 hover:bg-surface-panel/80 hover:text-text-primary hover:backdrop-blur-xl',
                        'dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white',
                      ],
                )}
                style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {Icon ? (
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-amber-600 dark:text-amber-200'
                          : 'text-text-muted group-hover:text-amber-500 dark:text-white/50 dark:group-hover:text-amber-200'
                      )}
                    />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </span>
                {badge ? <BadgePill badge={badge} /> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
