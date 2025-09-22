import type { ReactNode } from 'react'

import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

export interface CatalogShellProps {
  header: ReactNode
  breadcrumbs?: ReactNode
  toolbar?: ReactNode
  sidebar?: ReactNode
  children: ReactNode
  tray?: ReactNode
  className?: string
}

export function CatalogShell({
  header,
  breadcrumbs,
  toolbar,
  sidebar,
  children,
  tray,
  className,
}: CatalogShellProps) {
  const hasSidebar = Boolean(sidebar)

  return (
    <div className={cn('catalog-shell space-y-10 pb-20 pt-10 sm:pt-16', className)}>
      <Container size="xl" bleed="none" className="flex flex-col gap-4">
        {breadcrumbs ? <div className="text-xs text-text-muted">{breadcrumbs}</div> : null}
        {header}
        {toolbar}
      </Container>

      <Container
        size="xl"
        bleed="none"
        className={cn('flex flex-col gap-6', hasSidebar && 'lg:flex-row lg:items-start lg:gap-8')}
      >
        {hasSidebar ? <aside className="w-full flex-shrink-0 lg:w-72 xl:w-80">{sidebar}</aside> : null}
        <div className="min-w-0 flex-1">{children}</div>
      </Container>

      {tray ? <div className="sticky bottom-8 z-30 min-h-[56px]">{tray}</div> : null}
    </div>
  )
}
