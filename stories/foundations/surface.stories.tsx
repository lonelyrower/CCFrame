import type { Meta, StoryObj } from '@storybook/react';
import { Surface } from '@/components/ui/surface';
import { Stack } from '@/components/ui/stack';
import { Heading, Text } from '@/components/ui/typography';

const meta: Meta<typeof Surface> = {
  title: 'Foundations/Surface',
  component: Surface,
  parameters: {
    layout: 'centered'
  }
};

export default meta;

type Story = StoryObj<typeof Surface>;

export const Tones: Story = {
  render: () => (
    <Stack direction="column" gap="lg">
      <Surface tone="canvas" padding="lg">
        <Heading size="md">Canvas</Heading>
        <Text tone="muted">用于页面背景和全局容器。</Text>
      </Surface>
      <Surface tone="panel" padding="lg">
        <Heading size="md">Panel</Heading>
        <Text tone="muted">常规内容面板，具备柔和阴影和边框。</Text>
      </Surface>
      <Surface tone="glass" padding="lg" interactive>
        <Heading size="md">Glass</Heading>
        <Text tone="muted">玻璃质感适合悬浮导航或浮层。</Text>
      </Surface>
    </Stack>
  )
};

export const Interactive: Story = {
  render: () => (
    <Surface tone="panel" padding="lg" interactive>
      <Heading size="sm">悬停试试看</Heading>
      <Text tone="secondary">带有交互状态的 Surface 会提升阴影与光感。</Text>
    </Surface>
  )
};
