import { Image, UploadCloud, AlertTriangle, HardDrive } from 'lucide-react'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { AdminDashboardMetrics, AdminTaskCenterSummary } from '@/types/admin'

interface DashboardMetricsBoardProps {
  metrics: AdminDashboardMetrics
  taskSummary: AdminTaskCenterSummary
}

const numberFormatter = new Intl.NumberFormat('zh-CN')

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function DashboardMetricsBoard({ metrics, taskSummary }: DashboardMetricsBoardProps) {
  const cards = [
    {
      id: 'photos-total',
      title: '作品总数',
      value: numberFormatter.format(metrics.totalPhotos),
      caption: `${numberFormatter.format(metrics.publicPhotos)} 公开 · ${numberFormatter.format(metrics.privatePhotos)} 私密`,
      icon: Image,
      toneClass: 'text-primary',
      backgroundClass: 'bg-primary/10 text-primary',
    },
    {
      id: 'uploads-active',
      title: '排队 / 处理中',
      value: numberFormatter.format(metrics.processing),
      caption: `${numberFormatter.format(metrics.recentUploads)} 条近 7 日新增`,
      icon: UploadCloud,
      toneClass: 'text-sky-500',
      backgroundClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-200',
    },
    {
      id: 'uploads-failed',
      title: '失败任务',
      value: numberFormatter.format(metrics.failedUploads),
      caption: `${numberFormatter.format(taskSummary.critical)} 关键 · ${numberFormatter.format(taskSummary.warning)} 提醒`,
      icon: AlertTriangle,
      toneClass: 'text-amber-500',
      backgroundClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-200',
    },
    {
      id: 'storage',
      title: '存储占用',
      value: formatBytes(metrics.storageUsedBytes),
      caption: `${numberFormatter.format(metrics.totalAlbums)} 个专辑`,
      icon: HardDrive,
      toneClass: 'text-emerald-500',
      backgroundClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Surface key={card.id} tone="panel" padding="lg" className="flex flex-col gap-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <Heading size="sm">{card.title}</Heading>
            <span className={`rounded-lg p-2 ${card.backgroundClass}`}>
              <card.icon className={`h-5 w-5 ${card.toneClass}`} />
            </span>
          </div>
          <div>
            <Text size="lg" weight="semibold" className="tracking-tight text-text-primary">
              {card.value}
            </Text>
            <Text size="xs" tone="secondary" className="mt-1">
              {card.caption}
            </Text>
          </div>
        </Surface>
      ))}
    </div>
  )
}
