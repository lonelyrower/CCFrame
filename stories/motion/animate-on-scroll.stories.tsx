import type { Meta, StoryObj } from '@storybook/react'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'

const meta: Meta<typeof AnimateOnScroll> = {
  title: 'Motion/AnimateOnScroll',
  component: AnimateOnScroll,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof AnimateOnScroll>

export const Showcase: Story = {
  render: () => (
    <div className="min-h-screen bg-surface-canvas py-16">
      <Container size="lg" bleed="none" className="space-y-8">
        {[0, 1, 2].map((index) => (
          <AnimateOnScroll key={index} delay={index * 0.08}>
            <Surface tone="panel" padding="lg" className="shadow-subtle space-y-2">
              <Heading size="sm"> {index + 1}</Heading>
              <Text tone="secondary" size="sm">
                Ӵʱԣѭ prefers-reduced-motion Զ
              </Text>
            </Surface>
          </AnimateOnScroll>
        ))}
      </Container>
    </div>
  ),
}