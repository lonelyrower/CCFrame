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
    <div className="flex h-[4.75rem] items-center border-b border-surface-outline/40 bg-surface-canvas/90 px-4 backdrop-blur md:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-3">
        <AdminNavigationMobileToggle />

        <Link
          href="/admin"
          className="hidden items-center gap-2 rounded-xl border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm font-semibold text-text-primary shadow-subtle transition hover:border-primary/60 hover:text-primary lg:flex"
        >
          <span className="rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary/90">
            Admin
          </span>
          <span>管理中心</span>
        </Link>

        {commandPaletteEnabled ? (
          <CommandPaletteLauncher onOpen={openCommandPalette} />
        ) : null}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {primaryAction ? (
          <Button
            type="button"
            variant={mapIntentToVariant(primaryAction.intent)}
            size="sm"
            onClick={() => handleAction(primaryAction)}
            className={cn('inline-flex items-center gap-2 md:hidden', primaryAction.intent === 'primary' ? 'shadow-soft' : undefined)}
          >
            {PrimaryActionIcon ? <PrimaryActionIcon className="h-4 w-4" /> : null}
            <span>{primaryAction.label}</span>
            {primaryBadge ? <BadgePill badge={primaryBadge} /> : null}
          </Button>
        ) : null}

        {adminQuickActions.map((action) => (
          <QuickActionButton
            key={action.id}
            action={action}
            badge={formatQuickActionBadge(action, metrics)}
            onClick={() => handleAction(action)}
            disabled={action.id === 'open-command' && !commandPaletteEnabled}
          />
        ))}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="切换主题"
        >
          {themeIcon}
        </Button>

        <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
          <Link href="/" className="font-medium">
            查看前台
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="hidden items-center gap-2 md:inline-flex"
        >
          <LogOut className="h-4 w-4" />
          退出
          {session?.user?.name ? (
            <span className="hidden text-xs text-text-secondary xl:inline">{session.user.name}</span>
          ) : null}
        </Button>
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
      className="group flex h-11 w-full max-w-md items-center gap-3 rounded-xl border border-surface-outline/50 bg-surface-panel/80 px-3 text-sm text-text-secondary shadow-subtle transition hover:border-primary/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Command className="h-4 w-4 text-text-muted group-hover:text-primary" />
      <Input
        readOnly
        value="搜索页面、操作或命令 (Ctrl/Cmd + K)"
        className="h-auto flex-1 border-none bg-transparent p-0 text-sm text-inherit shadow-none"
      />
      <span className="hidden items-center gap-1 text-[11px] font-medium text-text-muted sm:flex">
        <kbd className="rounded-md border border-surface-outline/60 bg-surface-panel/80 px-1.5 py-0.5">⌘</kbd>
        <kbd className="rounded-md border border-surface-outline/60 bg-surface-panel/80 px-1.5 py-0.5">K</kbd>
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

function QuickActionButton({ action, badge, onClick, disabled }: QuickActionButtonProps) {
  const Icon = action.icon
  const variant = mapIntentToVariant(action.intent)

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'hidden items-center gap-2 md:inline-flex',
        action.intent === 'primary' ? 'shadow-soft md:inline-flex' : undefined,
        disabled ? 'cursor-not-allowed opacity-60' : undefined,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{action.label}</span>
      {badge ? <BadgePill badge={badge} /> : null}
    </Button>
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
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none',
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
    case 'info':
      return 'border-transparent bg-primary/10 text-primary'
    case 'success':
      return 'border-transparent bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
    case 'neutral':
    default:
      return 'border-surface-outline/40 bg-surface-panel/60 text-text-secondary'
  }
}



