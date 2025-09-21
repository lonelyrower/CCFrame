import type { CSSProperties, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type GridBreakpoint = 'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type GridSpanValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

type GridTemplate = Partial<Record<GridBreakpoint, GridSpanValue>>

type GapScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type AlignItems = 'start' | 'center' | 'stretch'

const breakpointPrefix: Record<GridBreakpoint, string> = {
  base: '',
  xs: 'xs:',
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
}

const gapVars: Record<GapScale, string> = {
  xs: 'var(--token-layout-gutter-xs)',
  sm: 'var(--token-layout-gutter-sm)',
  md: 'var(--token-layout-gutter-md)',
  lg: 'var(--token-layout-gutter-lg)',
  xl: 'var(--token-layout-gutter-xl)',
}

const alignClass: Record<AlignItems, string> = {
  start: 'items-start',
  center: 'items-center',
  stretch: 'items-stretch',
}

const spanClass = (bp: GridBreakpoint, span: GridSpanValue) => {
  const prefix = breakpointPrefix[bp]
  return `${prefix}grid-cols-${span === 12 ? '12' : span}`
}

const colSpanClass = (bp: GridBreakpoint, span: GridSpanValue) => {
  const prefix = breakpointPrefix[bp]
  return `${prefix}col-span-${span === 12 ? '12' : span}`
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: GridTemplate
  gap?: GapScale
  rowGap?: GapScale
  align?: AlignItems
  dense?: boolean
}

export function Grid({
  className,
  columns,
  gap = 'md',
  rowGap,
  align = 'stretch',
  dense,
  style,
  ...rest
}: GridProps) {
  const template: GridTemplate = {
    base: 1,
    md: 2,
    ...(columns ?? {}),
  }

  const classes: string[] = ['grid w-full']
  const gapStyle: CSSProperties & { '--grid-gap'?: string; '--grid-row-gap'?: string } = {
    ...(style as CSSProperties),
  }

  const bpEntries = Object.entries(template) as Array<[GridBreakpoint, GridSpanValue]>
  bpEntries.forEach(([bp, span]) => {
    classes.push(spanClass(bp, span))
  })

  if (dense) {
    classes.push('grid-flow-row-dense')
  }

  if (gap) {
    gapStyle['--grid-gap'] = gapVars[gap]
    classes.push('gap-[var(--grid-gap)]')
  }

  if (rowGap) {
    gapStyle['--grid-row-gap'] = gapVars[rowGap]
    classes.push('gap-y-[var(--grid-row-gap)]')
  }

  classes.push(alignClass[align])

  return (
    <div
      className={cn(classes, className)}
      style={gapStyle}
      {...rest}
    />
  )
}

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  span?: GridTemplate
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export function GridItem({
  className,
  span,
  align,
  ...rest
}: GridItemProps) {
  const spanTemplate: GridTemplate = {
    base: 12,
    ...(span ?? {}),
  }

  const classes: string[] = []
  const entries = Object.entries(spanTemplate) as Array<[GridBreakpoint, GridSpanValue]>
  entries.forEach(([bp, value]) => {
    classes.push(colSpanClass(bp, value))
  })

  if (align) {
    const alignMap: Record<Required<GridItemProps>['align'], string> = {
      start: 'self-start',
      center: 'self-center',
      end: 'self-end',
      stretch: 'self-stretch',
    }
    classes.push(alignMap[align])
  }

  return <div className={cn(classes, className)} {...rest} />
}
