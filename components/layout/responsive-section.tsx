import type { ElementType } from 'react'

import { cn } from '@/lib/utils'
import { Section, type SectionProps } from '@/components/ui/section'
import {
  Container,
  type ContainerAlign,
  type ContainerBleed,
  type ContainerProps,
  type ContainerSize,
} from './container'

export interface ResponsiveSectionProps extends SectionProps {
  as?: ElementType
  containerSize?: ContainerSize
  containerBleed?: ContainerBleed
  containerAlign?: ContainerAlign
  containerClassName?: string
  containerProps?: Omit<ContainerProps, 'size' | 'bleed' | 'align' | 'as' | 'className'>
}

export function ResponsiveSection({
  as,
  containerSize = 'lg',
  containerBleed = 'none',
  containerAlign = 'center',
  containerClassName,
  containerProps,
  className,
  ...section
}: ResponsiveSectionProps) {
  const ContainerComponent = as ?? 'section'

  return (
    <Container
      as={ContainerComponent}
      size={containerSize}
      bleed={containerBleed}
      align={containerAlign}
      className={cn('py-12 sm:py-16 lg:py-20', containerClassName)}
      {...containerProps}
    >
      <Section className={cn('shadow-subtle', className)} {...section} />
    </Container>
  )
}
