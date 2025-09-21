import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const headingVariants = cva('font-display text-text-primary tracking-tight', {
  variants: {
    size: {
      xl: 'text-4xl md:text-5xl leading-tight',
      lg: 'text-3xl md:text-4xl leading-tight',
      md: 'text-2xl leading-tight',
      sm: 'text-xl leading-snug',
      xs: 'text-lg leading-snug',
    },
    tone: {
      default: 'text-text-primary',
      muted: 'text-text-secondary',
      inverted: 'text-text-inverted',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'default',
  },
})

const textVariants = cva('font-sans antialiased', {
  variants: {
    size: {
      xs: 'text-xs leading-relaxed',
      sm: 'text-sm leading-relaxed',
      md: 'text-base leading-relaxed',
      lg: 'text-lg leading-relaxed',
    },
    tone: {
      default: 'text-text-primary',
      muted: 'text-text-muted',
      secondary: 'text-text-secondary',
      inverted: 'text-text-inverted',
      success: 'text-state-success',
      warning: 'text-state-warning',
      danger: 'text-state-danger',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'default',
    weight: 'regular',
  },
})

const overlineVariants = cva(
  'font-sans text-xs uppercase tracking-[0.32em] text-text-muted',
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Component = 'h2', size, tone, className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ size, tone }), className)}
        {...props}
      />
    )
  },
)

Heading.displayName = 'Heading'

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ size, tone, weight, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(textVariants({ size, tone, weight }), className)}
        {...props}
      />
    )
  },
)

Text.displayName = 'Text'

export interface OverlineProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export const Overline = React.forwardRef<HTMLSpanElement, OverlineProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn(overlineVariants(), className)} {...props} />
  ),
)

Overline.displayName = 'Overline'
