import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/stack';

const meta: Meta<typeof Button> = {
  title: 'Foundations/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  }
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: () => (
    <Stack direction="column" gap="md">
      <Stack direction="row" gap="md">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="glass">Glass</Button>
        <Button variant="link">Link</Button>
      </Stack>
      <Stack direction="row" gap="md">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Star">
          ★
        </Button>
      </Stack>
    </Stack>
  )
};

export const Weights: Story = {
  render: () => (
    <Stack direction="column" gap="md">
      <Button weight="regular">Regular weight</Button>
      <Button weight="bold">Bold weight</Button>
    </Stack>
  )
};
