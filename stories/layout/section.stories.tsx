import type { Meta, StoryObj } from '@storybook/react';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof Section>;

export const Basic: Story = {
  render: () => (
    <div className="min-h-screen bg-surface-canvas p-8">
      <Section
        eyebrow="Foundations"
        title="模块化 Section 组件"
        description="用于构建具有标题、描述、操作区的模块容器，可结合 Surface tone 与 padding 定制表层。"
        actions={<Button>操作按钮</Button>}
      >
        <Text tone="secondary">
          Section 通过组合 Surface 与 Typography，统一了边距、色彩以及信息层级表现。
        </Text>
      </Section>
    </div>
  )
};

export const GridContent: Story = {
  render: () => (
    <div className="min-h-screen bg-surface-canvas p-8">
      <Section
        eyebrow="Gallery"
        title="卡片布局"
        description="展示 Surface 内部使用 Stack/网格的方式。"
        tone="panel"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Section key={index} tone="canvas" padding="sm">
              <Text>子模块 {index + 1}</Text>
            </Section>
          ))}
        </div>
      </Section>
    </div>
  )
};
