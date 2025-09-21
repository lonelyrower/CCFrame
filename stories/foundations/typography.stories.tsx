import type { Meta, StoryObj } from '@storybook/react';
import { Heading, Text, Overline } from '@/components/ui/typography';
import { Stack } from '@/components/ui/stack';

const meta: Meta<typeof Heading> = {
  title: 'Foundations/Typography',
  component: Heading,
  parameters: {
    layout: 'padded'
  }
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Headings: Story = {
  render: () => (
    <Stack direction="column" gap="md">
      <Heading size="xl">展示级标题 XL</Heading>
      <Heading size="lg">展示级标题 LG</Heading>
      <Heading size="md">章节标题 MD</Heading>
      <Heading size="sm">小标题 SM</Heading>
      <Heading size="xs">说明标题 XS</Heading>
    </Stack>
  )
};

export const BodyText: Story = {
  render: () => (
    <Stack direction="column" gap="sm">
      <Text size="md">默认正文排版，使用 tokens 中定义的行高与字体。</Text>
      <Text size="sm">小号正文排版，可用于辅助说明或标签。</Text>
      <Text tone="muted">Muted 文本适合次要信息。</Text>
      <Text tone="secondary">Secondary 文本用于强调的次级内容。</Text>
      <Text tone="success">成功状态文本</Text>
      <Text tone="warning">警示状态文本</Text>
      <Text tone="danger">危险状态文本</Text>
    </Stack>
  )
};

export const OverlineAndEyebrow: Story = {
  render: () => (
    <Stack direction="column" gap="md">
      <Overline>SECTION LABEL</Overline>
      <Heading size="md">与标题组合使用</Heading>
      <Text tone="muted">Overline/ Eyebrow 文本可用于分区标签或栏目说明。</Text>
    </Stack>
  )
};
