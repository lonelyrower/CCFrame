import type { CSSProperties, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type RailGap = 'xs' | 'sm' | 'md' | 'lg'

type RailSnapMode = 'mandatory' | 'proximity' | 'none'

const railGapVars: Record<RailGap, string> = {
  xs: 'var(--token-layout-gutter-xs)',
  sm: 'var(--token-layout-gutter-sm)',
  md: 'var(--token-layout-gutter-md)',
  lg: 'var(--token-layout-gutter-lg)',
}

const snapClass: Record<RailSnapMode, string> = {
  mandatory: 'snap-x snap-mandatory',
  proximity: 'snap-x snap-proximity',
  none: '',
}

export interface ContentRailProps extends HTMLAttributes<HTMLDivElement> {
  gap?: RailGap
  snapMode?: RailSnapMode
  fadeEdges?: boolean
}

export function ContentRail({
  className,
  children,
  gap = 'md',
  snapMode = 'mandatory',
  fadeEdges = true,
  style,
  ...rest
}: ContentRailProps) {
  const railStyle: CSSProperties & { '--content-rail-gap'?: string } = {
    ...(style as CSSProperties),
    '--content-rail-gap': railGapVars[gap],
  }

  return (
    <div className={cn('relative', className)} {...rest}>
      {fadeEdges ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface-canvas via-surface-canvas/60 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface-canvas via-surface-canvas/60 to-transparent" />
        </>
      ) : null}
      <div
        className={cn(
          'flex overflow-x-auto pb-4',
          snapClass[snapMode],
          fadeEdges ? 'px-4 sm:px-6 lg:px-0' : '',
        )}
        style={railStyle}
      >
        <div className="flex min-w-full gap-[var(--content-rail-gap)]">
          {children}
        </div>
      </div>
    </div>
  )
}
