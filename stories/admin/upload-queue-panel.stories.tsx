import type { Meta, StoryObj } from '@storybook/react'

import { UploadQueuePanel } from '@/components/admin/upload-queue-panel'
import type { UploadQueueSnapshotDto } from '@/types/upload'

const sampleSnapshot: UploadQueueSnapshotDto = {
  counts: {
    queued: 3,
    processing: 2,
    failed: 1,
    completed24h: 18,
  },
  guard: {
    storageUsedBytes: 32 * 1024 * 1024 * 1024,
    storageLimitBytes: 64 * 1024 * 1024 * 1024,
    percentUsed: 50,
    approachingLimit: false,
    message: '已使用 32 GB / 64 GB',
  },
  groups: [
    {
      id: 'queued',
      title: '排队中',
      description: '等待处理的上传任务。',
      total: 3,
      items: [
        {
          id: 'queue-101',
          jobId: '101',
          photoId: 'photo_101',
          fileName: 'lookbook-shoot-raw.heic',
          status: 'queued',
          progress: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 'queue-102',
          jobId: '102',
          photoId: 'photo_102',
          fileName: 'studio-backdrop.jpg',
          status: 'queued',
          progress: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        },
        {
          id: 'queue-103',
          jobId: '103',
          photoId: 'photo_103',
          fileName: 'color-test.webp',
          status: 'queued',
          progress: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
      ],
    },
    {
      id: 'processing',
      title: '处理中',
      description: '当前正在生成变体或嵌入。',
      total: 2,
      items: [
        {
          id: 'processing-201',
          jobId: '201',
          photoId: 'photo_201',
          fileName: 'runway-detail.png',
          status: 'processing',
          progress: 62,
          visibility: 'PRIVATE',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        },
        {
          id: 'processing-202',
          jobId: '202',
          photoId: 'photo_202',
          fileName: 'editorial-cover.avif',
          status: 'processing',
          progress: 88,
          visibility: 'PUBLIC',
          createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60).toISOString(),
        },
      ],
    },
    {
      id: 'completed',
      title: '已完成',
      description: '最近完成的任务。',
      total: 3,
      items: [
        {
          id: 'completed-301',
          jobId: null,
          photoId: 'photo_301',
          fileName: 'campaign-night.jpg',
          status: 'completed',
          progress: 100,
          visibility: 'PUBLIC',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          thumbUrl: 'https://via.placeholder.com/80x80.png?text=Photo',
        },
        {
          id: 'completed-302',
          jobId: null,
          photoId: 'photo_302',
          fileName: 'flatlay-accessories.png',
          status: 'completed',
          progress: 100,
          visibility: 'PRIVATE',
          createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
      ],
    },
    {
      id: 'failed',
      title: '异常任务',
      description: '需要人工复核的失败任务。',
      total: 1,
      items: [
        {
          id: 'failed-401',
          jobId: null,
          photoId: 'photo_401',
          fileName: 'backstage-video.mov',
          status: 'failed',
          progress: 0,
          error: '文件格式暂不支持',
          createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        },
      ],
    },
  ],
  generatedAt: new Date().toISOString(),
}

const meta: Meta<typeof UploadQueuePanel> = {
  title: 'Admin/Upload/UploadQueuePanel',
  component: UploadQueuePanel,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof UploadQueuePanel>

export const Default: Story = {
  args: {
    initialData: sampleSnapshot,
  },
}
