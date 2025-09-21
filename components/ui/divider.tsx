import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'subtle'
  length?: 'sm' | 'md' | 'lg' | 'full'
}

const lengthMap = {
  sm: 'w-12',
  md: 'w-24',
  lg: 'w-40',
  full: 'w-full',
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'default',
      length = 'full',
      className,
      ...props
    },
    ref,
  ) => {
    const isVertical = orientation === 'vertical'

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          'bg-surface-outline/60',
          isVertical ? 'h-full w-px' : 'h-px',
          !isVertical && lengthMap[length],
          variant === 'subtle' && 'bg-surface-outline/40',
          className,
        )}
        {...props}
      />
    )
  },
)

Divider.displayName = 'Divider'
