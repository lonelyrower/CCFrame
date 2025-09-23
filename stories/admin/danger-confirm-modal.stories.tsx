import type { Meta, StoryObj } from '@storybook/react'

import { DangerConfirmModal } from '@/components/admin/danger-confirm-modal'

const meta: Meta<typeof DangerConfirmModal> = {
  title: 'Admin/Settings/DangerConfirmModal',
  component: DangerConfirmModal,
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof DangerConfirmModal>

export const Open: Story = {
  args: {
    open: true,
    title: '确认清空上传缓存？',
    description: '操作将删除待处理的上传任务并触发重新扫描，请确保已备份。',
    confirmLabel: '立即清空',
    onClose: () => {},
    onConfirm: () => {},
  },
}
