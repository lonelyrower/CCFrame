import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode
  sidebar?: ReactNode
  footer?: ReactNode
  overlays?: ReactNode
  sidebarPosition?: 'start' | 'end'
  sidebarLabel?: string
  statusMessage?: string
  contentClassName?: string
  contentPadding?: 'auto' | 'none' | 'compact'
}

export function AppShell({
  header,
  sidebar,
  footer,
  overlays,
  sidebarPosition = 'start',
  sidebarLabel,
  statusMessage,
  contentClassName,
  contentPadding = 'auto',
  children,
  className,
  ...rest
}: AppShellProps) {
  const sidebarFirst = sidebarPosition === 'start'

  const paddingClasses =
    contentPadding === 'auto'
      ? sidebar
        ? 'px-4 pb-16 pt-6 md:px-6 lg:px-10'
        : 'px-4 pb-16 pt-10 md:px-6 lg:px-12'
      : contentPadding === 'compact'
        ? 'px-4 pb-12 pt-6 md:px-6 lg:px-8'
        : ''

  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col bg-surface-canvas text-text-primary',
        className,
      )}
      {...rest}
    >
      <a
        href="#main-content"
        className="absolute left-6 top-4 z-[100] -translate-y-20 rounded-full bg-surface-panel px-4 py-2 text-sm font-medium text-text-primary shadow-subtle transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        跳转到主要内容
      </a>

      {overlays ? (
        <div
          id="app-shell-overlays"
          className="pointer-events-none fixed inset-0 z-overlay flex flex-col gap-4 p-4"
          aria-live="polite"
        >
          {overlays}
        </div>
      ) : null}

      {header ? (
        <header className="sticky top-0 z-sticky border-b border-surface-outline/40 bg-surface-canvas/90 backdrop-blur" role="banner">
          {header}
        </header>
      ) : null}

      <div className={cn('relative flex flex-1 flex-col lg:flex-row', sidebar ? 'lg:gap-8' : undefined)}>
        {sidebar ? (
          <aside
            role="complementary"
            aria-label={sidebarLabel || '侧边导航'}
            className={cn(
              'w-full border-surface-outline/40 bg-surface-panel/80 backdrop-blur-sm lg:min-h-[calc(100vh-4rem)] lg:w-[var(--token-layout-sidebar-lg)] lg:max-w-[var(--token-layout-sidebar-lg)] lg:border-r',
              sidebarFirst ? 'order-[-1] lg:order-none' : 'order-last lg:order-none',
            )}
          >
            <div className="sticky top-[4.75rem] hidden h-[calc(100vh-5.5rem)] overflow-y-auto px-6 py-6 lg:block">
              {sidebar}
            </div>
            <div className="lg:hidden">
              {sidebar}
            </div>
          </aside>
        ) : null}

        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          aria-label={sidebar ? '主要内容区域' : '内容区域'}
          className={cn('flex flex-1 flex-col bg-surface-canvas/60', paddingClasses, contentClassName)}
        >
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="app-shell-status-region">
            {statusMessage ?? null}
          </div>
          {children}
        </main>
      </div>

      {footer ? (
        <footer className="border-t border-surface-outline/40 bg-surface-canvas/90">
          {footer}
        </footer>
      ) : null}
    </div>
  )
}
