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
    <nav className={cn('hidden flex-col gap-8 lg:flex', className)} aria-label="后台主要导航">
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
    <div className="space-y-2">
      {title ? (
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
      ) : null}
      <ul className="space-y-1">
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
                  'group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-soft'
                    : 'text-text-secondary hover:bg-surface-panel/80 hover:text-text-primary',
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {Icon ? <Icon className="h-4 w-4 shrink-0 text-text-muted group-hover:text-primary" /> : null}
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
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
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
      return 'border-transparent bg-red-500/90 text-text-inverted dark:bg-red-500'
    case 'warning':
      return 'border-transparent bg-amber-200/70 text-amber-900 dark:bg-amber-300/80 dark:text-amber-950'
    case 'success':
      return 'border-transparent bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
    case 'info':
      return 'border-transparent bg-primary/10 text-primary'
    case 'neutral':
    default:
      return 'border-surface-outline/40 bg-surface-panel/60 text-text-secondary'
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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? '关闭后台导航' : '打开后台导航'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-[4.5rem] z-40 overflow-hidden rounded-2xl border border-surface-outline/40 bg-surface-panel/95 p-4 shadow-floating backdrop-blur"
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
    <div className="space-y-2">
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
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
                  'flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-soft'
                    : 'bg-surface-canvas text-text-secondary hover:bg-surface-panel/80 hover:text-text-primary',
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {Icon ? <Icon className="h-4 w-4 shrink-0 text-text-muted" /> : null}
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
