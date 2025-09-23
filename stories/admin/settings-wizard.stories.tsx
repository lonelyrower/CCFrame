import type { Meta, StoryObj } from '@storybook/react'

import { SettingsWizard } from '@/components/admin/settings-wizard'
import type { AdminSettingsOverviewDto } from '@/types/settings'

const overview: AdminSettingsOverviewDto = {
  account: {
    email: 'admin@ccframe.local',
  },
  site: {
    title: 'CC Frame Staging',
    description: '演示环境，用于培训与巡检演练。',
    defaultVisibility: 'PUBLIC',
    allowPublicAccess: true,
  },
  storage: {
    provider: 'minio',
    bucket: 'ccframe-assets',
    region: 'us-east-1',
    endpoint: 'http://127.0.0.1:9000',
    cdnUrl: 'https://cdn.ccframe.dev',
  },
  integrations: {
    pixabayApiKey: 'demo-key',
    defaultSeedCount: 12,
  },
  runtime: {
    storage: {
      provider: 'minio',
      minio: {
        endpoint: 'http://127.0.0.1:9000',
        region: 'us-east-1',
        bucket: 'ccframe-assets',
        cdnUrl: 'https://cdn.ccframe.dev',
        forcePathStyle: true,
      },
    },
    semantic: {
      enabled: false,
      mode: 'off',
      provider: 'openai',
      model: 'text-embedding-3-small',
      dim: 1536,
    },
  },
}

const meta: Meta<typeof SettingsWizard> = {
  title: 'Admin/Settings/SettingsWizard',
  component: SettingsWizard,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof SettingsWizard>

export const Default: Story = {
  args: {
    initialData: overview,
  },
}
