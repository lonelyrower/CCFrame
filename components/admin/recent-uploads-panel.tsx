import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { AdminRecentUploadItem } from '@/types/admin'
import { cn } from '@/lib/utils'

interface RecentUploadsPanelProps {
  items: AdminRecentUploadItem[]
}

export function RecentUploadsPanel({ items }: RecentUploadsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading size="sm">最近上传</Heading>
        <Text size="xs" tone="muted">
          最新 {items.length} 条记录
        </Text>
      </div>
      <Surface tone="panel" padding="lg" className="shadow-subtle">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Text size="sm" tone="secondary">
              暂无上传记录。
            </Text>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <figure key={item.id} className="group relative overflow-hidden rounded-2xl border border-surface-outline/30 bg-surface-canvas/80">
                <div className="relative aspect-video w-full">
                  <Image
                    src={item.thumbUrl}
                    alt={item.title ?? 'Recent upload thumbnail'}
                    fill
                    sizes="(min-width: 1280px) 16vw, (min-width: 768px) 28vw, 80vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <figcaption className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <Text size="sm" weight="medium" className="truncate text-text-primary">
                      {item.title ?? '未命名文件'}
                    </Text>
                    <Text size="xs" tone="muted" className="truncate">
                      {item.albumTitle ?? '未归档'}
                    </Text>
                  </div>
                  <VisibilityBadge visibility={item.visibility} />
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Surface>
    </div>
  )
}

interface VisibilityBadgeProps {
  visibility: string
}

function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const isPublic = visibility === 'PUBLIC'
  const Icon = isPublic ? Eye : EyeOff
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
      isPublic ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200' : 'bg-surface-outline/40 text-text-secondary',
    )}>
      <Icon className="h-3.5 w-3.5" />
      {isPublic ? '公开' : '私密'}
    </span>
  )
}
