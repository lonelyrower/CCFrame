import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Surface, type SurfaceProps } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { Container, type ContainerSize } from './container'

export interface InfoPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  tone?: SurfaceProps['tone']
  size?: ContainerSize
  compact?: boolean
}

export function InfoPanel({
  title,
  description,
  aside,
  footer,
  children,
  className,
  tone = 'panel',
  size = 'lg',
  compact,
  ...rest
}: InfoPanelProps) {
  return (
    <Container as="section" size={size} bleed="none" className={cn('py-10 sm:py-14', className)} {...rest}>
      <Surface tone={tone} padding={compact ? 'md' : 'lg'} className="flex flex-col gap-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
          <div className="space-y-3">
            <Heading size="md" className="text-balance">
              {title}
            </Heading>
            {description ? (
              <Text tone="secondary" className="text-sm leading-relaxed">
                {description}
              </Text>
            ) : null}
            {aside ? <div className="mt-4 space-y-2 text-sm text-text-secondary">{aside}</div> : null}
          </div>

          <div className="flex flex-col gap-6">
            {children}
            {footer ? <div className="border-t border-surface-outline/40 pt-4 text-sm text-text-secondary">{footer}</div> : null}
          </div>
        </div>
      </Surface>
    </Container>
  )
}
