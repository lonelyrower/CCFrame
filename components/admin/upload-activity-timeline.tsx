"use client"

import useSWR from 'swr'
import { AlertTriangle, CheckCircle2, Clock, UploadCloud } from 'lucide-react'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { UploadQueueSnapshotDto, UploadTimelineEntryDto } from '@/types/upload'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => {
  if (!res.ok) throw new Error('Failed to load upload timeline')
  return res.json()
})

interface UploadActivityTimelineProps {
  initialData: UploadTimelineEntryDto[]
}

export function UploadActivityTimeline({ initialData }: UploadActivityTimelineProps) {
  const { data } = useSWR<UploadTimelineEntryDto[]>('/api/admin/upload/activity', fetcher, {
    fallbackData: initialData,
    refreshInterval: 45000,
  })

  const items = data ?? initialData

  return (
    <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
      <Heading size="sm">处理活动</Heading>
      {items.length === 0 ? (
        <p className="rounded-xl border border-surface-outline/40 bg-surface-panel/60 px-4 py-10 text-center text-sm text-text-muted">
          暂无最近的处理动态。
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <TimelineMarker severity={item.severity} />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Text size="sm" weight="medium" className="text-text-primary">
                    {item.title}
                  </Text>
                  <Text tone="secondary" size="xs">
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </Text>
                </div>
                {item.description ? (
                  <Text tone="secondary" size="xs">
                    {item.description}
                  </Text>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  )
}

function TimelineMarker({ severity }: { severity: UploadTimelineEntryDto['severity'] }) {
  let Icon = UploadCloud
  let tone = 'text-text-muted'
  let background = 'bg-surface-outline/40'

  switch (severity) {
    case 'success':
      Icon = CheckCircle2
      tone = 'text-emerald-500'
      background = 'bg-emerald-500/15'
      break
    case 'warning':
      Icon = Clock
      tone = 'text-amber-500'
      background = 'bg-amber-500/15'
      break
    case 'error':
      Icon = AlertTriangle
      tone = 'text-red-500'
      background = 'bg-red-500/15'
      break
    default:
      break
  }

  return (
    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${background}`}>
      <Icon className={`h-4 w-4 ${tone}`} />
    </span>
  )
}
