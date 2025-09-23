import { AlertTriangle, Camera, FileWarning, LogIn, UploadCloud, Folder } from 'lucide-react'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { AdminActivityItem } from '@/types/admin'

interface ActivityStreamProps {
  items: AdminActivityItem[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  upload: UploadCloud,
  photo: Camera,
  album: Folder,
  alert: AlertTriangle,
  warning: FileWarning,
  login: LogIn,
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function ActivityStream({ items }: ActivityStreamProps) {
  return (
    <Surface tone="panel" padding="lg" className="flex flex-col gap-4 shadow-subtle">
      <Heading size="sm">最新活动</Heading>
      {items.length === 0 ? (
        <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/60 px-4 py-10 text-center">
          <Text size="sm" tone="secondary">
            暂无活动记录。
          </Text>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-surface-outline/30 bg-surface-canvas/80 p-3">
              <div className="flex gap-3">
                <ActivityIcon iconKey={item.icon} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Heading size="xs" className="text-text-primary">
                      {item.title}
                    </Heading>
                    <Text size="xs" tone="muted">
                      {dateFormatter.format(item.timestamp)}
                    </Text>
                  </div>
                  {item.description ? (
                    <Text size="sm" tone="secondary" className="mt-1 break-words">
                      {item.description}
                    </Text>
                  ) : null}
                  {item.href ? (
                    <a href={item.href} className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
                      查看详情
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}

interface ActivityIconProps {
  iconKey?: string
}

function ActivityIcon({ iconKey }: ActivityIconProps) {
  const Icon = (iconKey && iconMap[iconKey]) || UploadCloud
  return (
    <span className="rounded-lg bg-surface-panel/80 p-2">
      <Icon className="h-4 w-4 text-primary" />
    </span>
  )
}
