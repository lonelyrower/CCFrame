import type { Meta, StoryObj } from '@storybook/react'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Surface> = {
  title: 'Layout/Panels',
  component: Surface,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof Surface>

export const DashboardOverview: Story = {
  render: () => (
    <div className="min-h-screen bg-surface-canvas py-10">
      <Container size="xl" bleed="none" className="space-y-6">
        <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Heading size="md">库概览</Heading>
              <Text tone="secondary" size="sm">
                面板结合 Surface 与 Typography，让标题、描述及操作保持统一节奏。
              </Text>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">刷新</Button>
              <Button>新建内容</Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: '总照片', value: '12,480' },
              { label: '本周上传', value: '128' },
              { label: '公开可见', value: '9,612' },
              { label: '存储占用', value: '86.4 GB' },
            ].map((stat) => (
              <Surface key={stat.label} tone="canvas" padding="md" className="shadow-subtle space-y-1">
                <Text tone="secondary" size="sm">
                  {stat.label}
                </Text>
                <Heading size="sm">{stat.value}</Heading>
              </Surface>
            ))}
          </div>
        </Surface>
      </Container>
    </div>
  ),
}

export const EmptyState: Story = {
  render: () => (
    <div className="min-h-screen bg-surface-canvas py-10">
      <Container size="lg" bleed="none">
        <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-xl">📂</span>
          </div>
          <Heading size="md">暂无结果</Heading>
          <Text tone="secondary" size="sm">
            空状态面板保持统一的留白和字号，便于在后台页面快速复用。
          </Text>
          <div className="flex justify-center gap-3">
            <Button variant="outline">导入数据</Button>
            <Button>新建标签</Button>
          </div>
        </Surface>
      </Container>
    </div>
  ),
}
