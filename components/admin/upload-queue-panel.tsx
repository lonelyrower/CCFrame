"use client"

import useSWR from 'swr'
import { AlertTriangle, CheckCircle2, Loader2, PauseCircle, RefreshCcw, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { UploadQueueSnapshotDto, UploadQueueItemDto } from '@/types/upload'
import { cn } from '@/lib/utils'

interface UploadQueuePanelProps {
  initialData: UploadQueueSnapshotDto
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => {
  if (!res.ok) throw new Error('Failed to load upload queue')
  return res.json()
})

export function UploadQueuePanel({ initialData }: UploadQueuePanelProps) {
  const { data, mutate, isValidating } = useSWR<UploadQueueSnapshotDto>('/api/admin/upload/queue', fetcher, {
    fallbackData: initialData,
    refreshInterval: 30000,
  })

  const snapshot = data ?? initialData

  return (
    <Surface tone="panel" padding="lg" className="shadow-subtle space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading size="sm">上传流水线</Heading>
          <Text tone="secondary" size="xs">
            查看当前队列状态、正在处理的任务与近期结果。
          </Text>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Button variant="ghost" size="sm" onClick={() => mutate()} disabled={isValidating} className="gap-1">
            {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            刷新
          </Button>
          <span>生成于 {new Date(snapshot.generatedAt).toLocaleTimeString('zh-CN')}</span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="排队" value={snapshot.counts.queued} icon={PauseCircle} tone="text-sky-500" />
        <MetricCard label="处理中" value={snapshot.counts.processing} icon={UploadCloud} tone="text-primary" />
        <MetricCard label="24h 成功" value={snapshot.counts.completed24h} icon={CheckCircle2} tone="text-emerald-500" />
        <MetricCard label="失败总数" value={snapshot.counts.failed} icon={AlertTriangle} tone="text-red-500" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {snapshot.groups.slice(0, 2).map((group) => (
          <QueueGroup key={group.id} group={group} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {snapshot.groups.slice(2).map((group) => (
          <QueueGroup key={group.id} group={group} />
        ))}
      </div>
    </Surface>
  )
}

interface MetricCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone: string
}

function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 p-4">
      <div className="flex items-center gap-3">
        <span className={cn('rounded-lg bg-surface-outline/30 p-2', tone)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <Text size="lg" weight="semibold" className="text-text-primary">
            {value}
          </Text>
          <Text tone="secondary" size="xs">
            {label}
          </Text>
        </div>
      </div>
    </div>
  )
}

interface QueueGroupProps {
  group: UploadQueueSnapshotDto['groups'][number]
}

function QueueGroup({ group }: QueueGroupProps) {
  return (
    <div className="rounded-2xl border border-surface-outline/40 bg-surface-panel/80">
      <header className="flex items-center justify-between border-b border-surface-outline/30 px-4 py-3">
        <div>
          <Heading size="xs">{group.title}</Heading>
          {group.description ? (
            <Text tone="secondary" size="xs" className="mt-1">
              {group.description}
            </Text>
          ) : null}
        </div>
        <span className="rounded-full bg-surface-outline/30 px-2 py-0.5 text-xs text-text-muted">{group.total}</span>
      </header>
      <div className="divide-y divide-surface-outline/10">
        {group.items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-text-muted">暂无记录</p>
        ) : (
          group.items.map((item) => <QueueRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}

function QueueRow({ item }: { item: UploadQueueItemDto }) {
  const status = mapStatus(item.status)
  const date = new Date(item.updatedAt)

  return (
    <div className="flex flex-col gap-2 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Text size="sm" weight="medium" className="truncate text-text-primary">
            {item.fileName}
          </Text>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5', status.badgeClass)}>
              <status.icon className="h-3 w-3" />
              {status.label}
            </span>
            {item.visibility ? <span>{item.visibility === 'PUBLIC' ? '公开' : '私密'}</span> : null}
            <span>{date.toLocaleTimeString('zh-CN')}</span>
            {typeof item.progress === 'number' && item.status !== 'completed' && item.status !== 'failed' ? (
              <span>{Math.round(item.progress)}%</span>
            ) : null}
          </div>
        </div>
        {item.thumbUrl ? (
          <div className="hidden h-12 w-12 overflow-hidden rounded-lg bg-surface-canvas/80 sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbUrl} alt={item.fileName} className="h-full w-full object-cover" />
          </div>
        ) : null}
      </div>
      {item.error ? (
        <Text tone="secondary" size="xs" className="text-red-500">
          {item.error}
        </Text>
      ) : null}
    </div>
  )
}

function mapStatus(status: UploadQueueItemDto['status']) {
  switch (status) {
    case 'processing':
      return { label: '处理中', icon: UploadCloud, badgeClass: 'bg-primary/10 text-primary' }
    case 'queued':
      return { label: '排队中', icon: PauseCircle, badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' }
    case 'completed':
      return { label: '已完成', icon: CheckCircle2, badgeClass: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-300' }
    case 'failed':
      return { label: '失败', icon: AlertTriangle, badgeClass: 'bg-red-500/10 text-red-500' }
    default:
      return { label: status, icon: UploadCloud, badgeClass: 'bg-surface-outline/30 text-text-secondary' }
  }
}
