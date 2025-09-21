import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const surfaceVariants = cva(
  'rounded-lg border border-surface-outline/60 text-text-primary shadow-surface transition-shadow duration-sm backdrop-blur-[2px]',
  {
    variants: {
      tone: {
        canvas: 'bg-surface-canvas',
        panel: 'bg-surface-panel backdrop-blur-sm',
        glass: 'bg-surface-glass backdrop-blur-xl border-white/10 shadow-floating',
        transparent: 'bg-transparent border-transparent shadow-none backdrop-blur-none',
      },
      padding: {
        none: 'p-0',
        xs: 'p-3',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        false: '',
        true: 'hover:shadow-floating focus-within:shadow-floating transition-shadow',
      },
    },
    defaultVariants: {
      tone: 'panel',
      padding: 'md',
      interactive: false,
    },
  }
)

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, tone, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(surfaceVariants({ tone, padding, interactive }), className)}
        {...props}
      />
    )
  }
)

Surface.displayName = 'Surface'

export const surfaceStyles = surfaceVariants
