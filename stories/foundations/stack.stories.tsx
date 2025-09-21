import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@/components/ui/stack';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/typography';

const meta: Meta<typeof Stack> = {
  title: 'Foundations/Stack',
  component: Stack,
  parameters: {
    layout: 'centered'
  }
};

export default meta;

type Story = StoryObj<typeof Stack>;

export const Directions: Story = {
  render: () => (
    <Stack direction="column" gap="lg">
      <Stack direction="row" gap="md">
        <Surface tone="panel" padding="sm"><Text>Row 1</Text></Surface>
        <Surface tone="panel" padding="sm"><Text>Row 2</Text></Surface>
        <Surface tone="panel" padding="sm"><Text>Row 3</Text></Surface>
      </Stack>
      <Stack direction="column" gap="sm">
        <Surface tone="panel" padding="sm"><Text>Column 1</Text></Surface>
        <Surface tone="panel" padding="sm"><Text>Column 2</Text></Surface>
        <Surface tone="panel" padding="sm"><Text>Column 3</Text></Surface>
      </Stack>
    </Stack>
  )
};

export const Alignment: Story = {
  render: () => (
    <Stack direction="column" gap="md" className="w-full max-w-md">
      <Stack direction="row" align="center" justify="between" gap="md">
        <Surface tone="panel" padding="sm" className="flex-1">
          <Text>Left</Text>
        </Surface>
        <Surface tone="panel" padding="sm" className="flex-1 text-right">
          <Text>Right</Text>
        </Surface>
      </Stack>
      <Stack direction="row" gap="sm" wrap>
        {Array.from({ length: 6 }).map((_, index) => (
          <Surface key={index} tone="canvas" padding="xs">
            <Text size="sm">Chip {index + 1}</Text>
          </Surface>
        ))}
      </Stack>
    </Stack>
  )
};
