import type { Meta, StoryObj } from '@storybook/react'

import { UploadActivityTimeline } from '@/components/admin/upload-activity-timeline'
import type { UploadTimelineEntryDto } from '@/types/upload'

const entries: UploadTimelineEntryDto[] = [
  {
    id: 'evt-1',
    type: 'UPLOAD',
    title: '上传已提交',
    timestamp: new Date().toISOString(),
    severity: 'info',
    description: 'lookbook-2025-01.heic',
  },
  {
    id: 'evt-2',
    type: 'UPLOAD_PROCESSED',
    title: '图像处理完成',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    severity: 'success',
    description: '生成 4 个变体，耗时 42 秒',
  },
  {
    id: 'evt-3',
    type: 'UPLOAD_FAILED',
    title: '上传处理失败',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    severity: 'error',
    description: 'SignatureDoesNotMatch，请检查 S3 凭据',
  },
]

const meta: Meta<typeof UploadActivityTimeline> = {
  title: 'Admin/Upload/UploadActivityTimeline',
  component: UploadActivityTimeline,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof UploadActivityTimeline>

export const Default: Story = {
  args: {
    initialData: entries,
  },
}
