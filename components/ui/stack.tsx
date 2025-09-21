import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrapMode: {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    direction: 'row',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrapMode: 'nowrap',
  },
})

interface StackVariants extends VariantProps<typeof stackVariants> {}

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<StackVariants, 'wrapMode'> {
  wrap?: boolean
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction,
      gap,
      align,
      justify,
      wrap = false,
      fullWidth,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          stackVariants({
            direction,
            gap,
            align,
            justify,
            wrapMode: wrap ? 'wrap' : 'nowrap',
            fullWidth,
          }),
          className,
        )}
        {...props}
      />
    )
  },
)

Stack.displayName = 'Stack'
