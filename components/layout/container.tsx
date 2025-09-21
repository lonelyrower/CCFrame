import type { ElementType, HTMLAttributes, PropsWithChildren } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      xs: 'max-w-layout-xs',
      sm: 'max-w-layout-sm',
      md: 'max-w-layout-md',
      lg: 'max-w-layout-lg',
      xl: 'max-w-layout-xl',
    },
    bleed: {
      none: 'px-4 sm:px-6 lg:px-8 xl:px-10',
      sm: 'px-3 sm:px-5 lg:px-7 xl:px-8',
      md: 'px-2 sm:px-4 lg:px-6 xl:px-6',
      lg: 'px-0 sm:px-2 lg:px-4 xl:px-4',
      full: 'px-0',
    },
    align: {
      center: '',
      start: 'lg:ml-0 lg:mr-auto',
    },
  },
  defaultVariants: {
    size: 'lg',
    bleed: 'none',
    align: 'center',
  },
})

export type ContainerSize = NonNullable<VariantProps<typeof containerVariants>['size']>
export type ContainerBleed = NonNullable<VariantProps<typeof containerVariants>['bleed']>
export type ContainerAlign = NonNullable<VariantProps<typeof containerVariants>['align']>

export type ContainerProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    as?: ElementType
    size?: ContainerSize
    bleed?: ContainerBleed
    align?: ContainerAlign
  }
>

export function Container({
  as,
  className,
  children,
  size,
  bleed,
  align,
  ...rest
}: ContainerProps) {
  const Component = (as ?? 'div') as ElementType

  return (
    <Component
      className={cn(containerVariants({ size, bleed, align }), className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

export const containerStyles = containerVariants
