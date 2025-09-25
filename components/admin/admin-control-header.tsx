"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Command, LogOut, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  adminQuickActions,
  formatQuickActionBadge,
  type AdminNavigationBadge,
  type AdminQuickAction,
} from '@/lib/admin/navigation-registry'
import { cn } from '@/lib/utils'
import { useAdminNavigationMetrics } from './use-admin-navigation-metrics'
import { useOptionalCommandPalette } from './use-optional-command-palette'
import { AdminNavigationMobileToggle } from './admin-navigation'
import { featureFlags } from '@/lib/config/feature-flags'

export function AdminControlHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const metrics = useAdminNavigationMetrics()
  const palette = useOptionalCommandPalette()
  const commandPaletteEnabled = featureFlags.enableCommandPalette && !!palette

  const primaryAction = adminQuickActions.find((action) => action.intent === 'primary')
  const primaryBadge = primaryAction ? formatQuickActionBadge(primaryAction, metrics) : undefined
  const PrimaryActionIcon = primaryAction?.icon

  const openCommandPalette = () => palette?.open?.()

  const handleAction = (action: AdminQuickAction) => {
    if (action.id === 'open-command') {
      openCommandPalette?.()
      return
    }

    if (action.href) {
      router.push(action.href)
    }
  }

  const themeIcon = resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />

  return (
    <div className="flex h-20 items-center border-b border-surface-outline/40 bg-surface-panel/80 px-6 backdrop-blur-xl md:px-8 dark:border-white/10 dark:bg-black/40">
      {/* Film grain background */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />

      <div className="relative flex flex-1 items-center gap-4">
        <AdminNavigationMobileToggle />

        <Link
          href="/admin"
          className="hidden items-center gap-3 rounded-[20px] border border-amber-200/20 bg-amber-100/5 px-4 py-2.5 text-sm font-light text-text-primary dark:text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-amber-200/40 hover:bg-amber-100/10 hover:scale-105 lg:flex"
          style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
        >
          <span className="rounded-[12px] bg-amber-200/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-100/90">
            Admin
          </span>
          <span>管理中心</span>
        </Link>

        {commandPaletteEnabled ? (
          <CommandPaletteLauncher onOpen={openCommandPalette} />
        ) : null}
      </div>

      <div className="relative flex items-center gap-3">
        {primaryAction ? (
          <button
            type="button"
            onClick={() => handleAction(primaryAction)}
            className="group flex items-center gap-2 rounded-[16px] border border-amber-200/30 bg-amber-100/10 px-4 py-2 text-sm font-light text-amber-100 backdrop-blur-xl transition-all duration-300 hover:border-amber-200/50 hover:bg-amber-100/20 hover:scale-105 md:hidden"
          >
            {PrimaryActionIcon ? <PrimaryActionIcon className="h-4 w-4" /> : null}
            <span>{primaryAction.label}</span>
            {primaryBadge ? <BadgePill badge={primaryBadge} /> : null}
          </button>
        ) : null}

        {adminQuickActions.map((action) => (
          <AdminQuickActionButton
            key={action.id}
            action={action}
            badge={formatQuickActionBadge(action, metrics)}
            onClick={() => handleAction(action)}
            disabled={action.id === 'open-command' && !commandPaletteEnabled}
          />
        ))}

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-surface-outline/50 bg-surface-panel/80 text-text-primary backdrop-blur-xl transition-all duration-300 hover:border-primary hover:bg-surface-panel/90 hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:border-amber-200/40 dark:hover:bg-amber-100/10 dark:hover:text-amber-100"
          aria-label="切换主题"
        >
          {themeIcon}
        </button>

        <Link
          href="/"
          className="hidden items-center gap-2 rounded-[16px] border border-surface-outline/50 bg-surface-panel/80 px-4 py-2 text-sm font-light text-text-primary backdrop-blur-xl transition-all duration-300 hover:border-primary hover:bg-surface-panel/90 hover:text-primary hover:scale-105 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:border-amber-200/40 dark:hover:bg-amber-100/10 dark:hover:text-amber-100 md:inline-flex"
        >
          查看前台
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="hidden items-center gap-2 rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-light text-red-100 backdrop-blur-xl transition-all duration-300 hover:border-red-400/50 hover:bg-red-500/20 hover:scale-105 md:inline-flex"
        >
          <LogOut className="h-4 w-4" />
          退出
          {session?.user?.name ? (
            <span className="hidden text-xs text-red-100/70 xl:inline">{session.user.name}</span>
          ) : null}
        </button>
      </div>
    </div>
  )
}

interface CommandPaletteLauncherProps {
  onOpen?: () => void
}

function CommandPaletteLauncher({ onOpen }: CommandPaletteLauncherProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-12 w-full max-w-md items-center gap-3 rounded-[20px] border border-surface-outline/50 bg-surface-panel/80 px-4 text-sm text-text-secondary shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-primary hover:bg-surface-panel/90 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/15 dark:bg-black/20 dark:text-white/70 dark:hover:border-amber-200/40 dark:hover:bg-amber-100/10 dark:hover:text-amber-100 dark:focus-visible:ring-amber-200/50"
    >
      <Command className="h-4 w-4 text-text-muted group-hover:text-primary dark:text-white/60 dark:group-hover:text-amber-200" />
      <Input
        readOnly
        value="搜索页面、操作或命令"
        className="h-auto flex-1 border-none bg-transparent p-0 text-sm text-inherit shadow-none placeholder-white/50"
        style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
      />
      <span className="hidden items-center gap-1 text-[11px] font-medium text-text-muted sm:flex dark:text-white/50">
        <kbd className="rounded-[6px] border border-surface-outline/40 bg-surface-panel/70 px-2 py-1 text-text-secondary dark:border-white/20 dark:bg-white/10 dark:text-white/70">⌘</kbd>
        <kbd className="rounded-[6px] border border-surface-outline/40 bg-surface-panel/70 px-2 py-1 text-text-secondary dark:border-white/20 dark:bg-white/10 dark:text-white/70">K</kbd>
      </span>
    </button>
  )
}

interface QuickActionButtonProps {
  action: AdminQuickAction
  badge?: AdminNavigationBadge
  onClick: () => void
  disabled?: boolean
}

function AdminQuickActionButton({ action, badge, onClick, disabled }: QuickActionButtonProps) {
  const Icon = action.icon

  const getButtonStyles = () => {
    switch (action.intent) {
      case 'primary':
        return "border-amber-200/30 bg-amber-100/10 text-amber-100 hover:border-amber-200/50 hover:bg-amber-100/20"
      case 'danger':
        return "border-red-400/30 bg-red-500/10 text-red-100 hover:border-red-400/50 hover:bg-red-500/20"
      case 'secondary':
      default:
        return "border-surface-outline/50 bg-surface-panel/80 text-text-primary hover:border-primary hover:bg-surface-panel/90 hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white"
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'hidden items-center gap-2 rounded-[16px] border px-4 py-2 text-sm font-light backdrop-blur-xl transition-all duration-300 hover:scale-105 md:inline-flex',
        getButtonStyles(),
        disabled ? 'cursor-not-allowed opacity-50' : undefined,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{action.label}</span>
      {badge ? <BadgePill badge={badge} /> : null}
    </button>
  )
}

function mapIntentToVariant(intent: AdminQuickAction['intent']) {
  switch (intent) {
    case 'danger':
      return 'destructive'
    case 'secondary':
      return 'secondary'
    case 'primary':
    default:
      return 'default'
  }
}

interface BadgePillProps {
  badge: AdminNavigationBadge
}

function BadgePill({ badge }: BadgePillProps) {
  const toneClass = getBadgeToneClass(badge.tone)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[8px] border px-2 py-1 text-[10px] font-medium leading-none tracking-wide',
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
      return 'border-red-400/40 bg-red-500/20 text-red-100'
    case 'warning':
      return 'border-amber-200/40 bg-amber-100/20 text-amber-100'
    case 'info':
      return 'border-blue-400/40 bg-blue-500/20 text-blue-100'
    case 'success':
      return 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
    case 'neutral':
    default:
      return 'border-surface-outline/50 bg-surface-panel/80 text-text-primary dark:border-white/30 dark:bg-white/10 dark:text-white/80'
  }
}



