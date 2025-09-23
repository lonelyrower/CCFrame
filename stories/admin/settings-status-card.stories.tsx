import type { Meta, StoryObj } from '@storybook/react'

import { SettingsStatusCard } from '@/components/admin/settings-status-card'
import type { SettingsValidationResultDto } from '@/types/settings'

const results: SettingsValidationResultDto[] = [
  {
    target: 'storage',
    success: true,
    message: '存储桶连通性正常。',
    timestamp: new Date().toISOString(),
  },
  {
    target: 'integrations',
    success: false,
    message: 'Pixabay API Key 未配置。',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
]

const meta: Meta<typeof SettingsStatusCard> = {
  title: 'Admin/Settings/SettingsStatusCard',
  component: SettingsStatusCard,
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof SettingsStatusCard>

export const Default: Story = {
  args: {
    results,
    onValidate: () => {},
  },
}
