import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Heading, Overline, Text } from '@/components/ui/typography'
import { Surface } from '@/components/ui/surface'
import { Container, type ContainerSize } from './container'
import { Grid, GridItem } from './grid'

export interface FeatureRowProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  media: ReactNode
  actions?: ReactNode
  reverse?: boolean
  subtleBackground?: boolean
  containerSize?: ContainerSize
}

export function FeatureRow({
  eyebrow,
  title,
  description,
  media,
  actions,
  reverse,
  subtleBackground = false,
  containerSize = 'lg',
  className,
  ...rest
}: FeatureRowProps) {
  return (
    <Container
      as="section"
      size={containerSize}
      bleed="none"
      className={cn('py-16 sm:py-20 lg:py-24', className)}
      {...rest}
    >
      <Grid columns={{ base: 1, md: 12 }} gap="lg" align="stretch">
        <GridItem
          span={{ base: 12, md: 5 }}
          className={cn('flex flex-col gap-5', reverse ? 'md:order-2' : 'md:order-1')}
        >
          <div className="space-y-3">
            {eyebrow ? <Overline className="text-text-muted">{eyebrow}</Overline> : null}
            {title ? (
              <Heading size="lg" className="text-balance">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <Text tone="secondary" className="text-balance">
                {description}
              </Text>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </GridItem>
        <GridItem
          span={{ base: 12, md: 7 }}
          className={cn('md:order-2', reverse ? 'md:order-1' : 'md:order-2')}
        >
          <Surface
            tone={subtleBackground ? 'panel' : 'transparent'}
            padding={subtleBackground ? 'md' : 'none'}
            className={cn('h-full w-full overflow-hidden', subtleBackground ? 'shadow-subtle' : '')}
          >
            <div className="h-full w-full">{media}</div>
          </Surface>
        </GridItem>
      </Grid>
    </Container>
  )
}
