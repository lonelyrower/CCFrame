import * as React from 'react'

import { cn } from '@/lib/utils'
import { Surface, type SurfaceProps } from './surface'
import { Heading, Overline, Text } from './typography'
import { Stack, type StackProps } from './stack'

export interface SectionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    Pick<SurfaceProps, 'tone' | 'padding' | 'interactive'> {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  headingSize?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  contentGap?: StackProps['gap']
}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  (
    {
      eyebrow,
      title,
      description,
      actions,
      tone = 'panel',
      padding = 'lg',
      interactive = false,
      headingSize = 'md',
      contentGap = 'md',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Surface
        ref={ref}
        tone={tone}
        padding={padding}
        interactive={interactive}
        className={cn('flex flex-col gap-6', className)}
        {...props}
      >
        {(eyebrow || title || description || actions) && (
          <Stack
            direction="row"
            align="center"
            justify={actions ? 'between' : 'start'}
            gap="md"
            className="flex-wrap gap-y-4"
          >
            <Stack direction="column" gap="xs" className="min-w-0">
              {eyebrow && (
                <Overline className="text-text-muted">{eyebrow}</Overline>
              )}
              {title && (
                <Heading size={headingSize} className="text-balance">
                  {title}
                </Heading>
              )}
              {description && (
                <Text tone="secondary" className="text-balance">
                  {description}
                </Text>
              )}
            </Stack>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </Stack>
        )}

        {children && (
          <Stack direction="column" gap={contentGap} className="min-w-0">
            {children}
          </Stack>
        )}
      </Surface>
    )
  },
)

Section.displayName = 'Section'
