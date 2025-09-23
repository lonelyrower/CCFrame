import { AlertTriangle, CheckCircle2, Clock, Settings, UploadCloud } from 'lucide-react'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { AdminTaskGroup, AdminTaskItem } from '@/types/admin'
import { cn } from '@/lib/utils'

interface TaskHubProps {
  groups: AdminTaskGroup[]
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const severityConfig: Record<AdminTaskItem['severity'], { icon: React.ComponentType<{ className?: string }>; tone: string; badge: string }> = {
  critical: {
    icon: AlertTriangle,
    tone: 'text-red-500',
    badge: 'bg-red-500/10 text-red-500',
  },
  warning: {
    icon: Clock,
    tone: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-200',
  },
  info: {
    icon: CheckCircle2,
    tone: 'text-sky-500',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-200',
  },
}

const groupIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  uploads: UploadCloud,
  review: Clock,
  configuration: Settings,
}

export function TaskHub({ groups }: TaskHubProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Surface key={group.id} tone="panel" padding="lg" className="flex flex-col gap-5 shadow-subtle">
          <header className="flex items-start justify-between gap-3">
            <div>
              <Heading size="sm">{group.title}</Heading>
              <Text size="xs" tone="secondary" className="mt-1 max-w-xl">
                {group.description}
              </Text>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>总计</span>
              <span className="rounded-full bg-surface-outline/40 px-2 py-0.5 text-text-primary">{group.total}</span>
            </div>
          </header>

          {group.tasks.length === 0 ? (
            <EmptyState title={group.emptyState.title} description={group.emptyState.description} actionHref={group.emptyState.actionHref} actionLabel={group.emptyState.actionLabel} />
          ) : (
            <ul className="space-y-3">
              {group.tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          )}
        </Surface>
      ))}
    </div>
  )
}

interface TaskRowProps {
  task: AdminTaskItem
}

function TaskRow({ task }: TaskRowProps) {
  const severity = severityConfig[task.severity]
  const Icon = severity.icon

  return (
    <li className="rounded-xl border border-surface-outline/40 bg-surface-canvas/80 p-3 transition hover:border-primary/40 hover:shadow-subtle">
      <div className="flex items-start gap-3">
        <span className={cn('rounded-lg bg-surface-panel/60 p-2', severity.badge)}>
          <Icon className={cn('h-4 w-4', severity.tone)} />
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <Heading size="xs" className="truncate text-text-primary">
              {task.title}
            </Heading>
            <Text size="xs" tone="muted">
              {dateFormatter.format(task.createdAt)}
            </Text>
          </div>
          {task.description ? (
            <Text size="sm" tone="secondary" className="break-words">
              {task.description}
            </Text>
          ) : null}
          {task.meta && task.meta.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[11px] text-text-muted">
              {task.meta.map((item, index) => (
                <span key={`${task.id}-meta-${index}`} className="rounded-full bg-surface-outline/40 px-2 py-0.5">
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
          ) : null}
          {task.href ? (
            <a href={task.href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              {task.actionLabel ?? '查看'}
            </a>
          ) : null}
        </div>
      </div>
    </li>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  const Icon = CheckCircle2
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-outline/40 bg-surface-panel/60 px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-emerald-500" />
      <div>
        <Heading size="xs">{title}</Heading>
        <Text size="sm" tone="secondary" className="mt-1">
          {description}
        </Text>
      </div>
      {actionHref && actionLabel ? (
        <a href={actionHref} className="text-xs font-semibold text-primary hover:underline">
          {actionLabel}
        </a>
      ) : null}
    </div>
  )
}

