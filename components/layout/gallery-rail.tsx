import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Heading, Text } from '@/components/ui/typography'
import { Container, type ContainerSize, type ContainerBleed } from './container'
import { ContentRail, type ContentRailProps } from './content-rail'

export interface GalleryRailProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  size?: ContainerSize
  bleed?: ContainerBleed
  railProps?: Omit<ContentRailProps, 'className'>
}

export function GalleryRail({
  title,
  description,
  actions,
  children,
  className,
  size = 'xl',
  bleed = 'none',
  railProps,
  ...rest
}: GalleryRailProps) {
  return (
    <Container
      as="section"
      size={size}
      bleed={bleed}
      className={cn('flex flex-col gap-6 py-12 sm:py-16', className)}
      {...rest}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg space-y-2">
            {title ? (
              <Heading size="lg" className="text-balance">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <Text tone="secondary" className="text-sm text-text-secondary">
                {description}
              </Text>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      )}

      <ContentRail {...railProps}>{children}</ContentRail>
    </Container>
  )
}
