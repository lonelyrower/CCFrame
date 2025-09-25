import { AlertTriangle, CheckCircle2, Clock, Settings, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'

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
    tone: 'text-red-200',
    badge: 'bg-red-400/20 text-red-200',
  },
  warning: {
    icon: Clock,
    tone: 'text-amber-200',
    badge: 'bg-amber-100/20 text-amber-200',
  },
  info: {
    icon: CheckCircle2,
    tone: 'text-blue-200',
    badge: 'bg-blue-400/20 text-blue-200',
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
      {groups.map((group, groupIndex) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: groupIndex * 0.1 + 0.3,
            ease: [0.25, 0.25, 0.25, 1]
          }}
          className="admin-surface-card"
        >
          {/* Film grain background */}
          <div
            className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px'
            }}
          />

          <div className="relative flex flex-col gap-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="admin-heading"
                  style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
                >
                  {group.title}
                </h2>
                <p className="admin-body mt-1 max-w-xl">
                  {group.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>总计</span>
                <span className="admin-chip px-2 py-0.5">
                  {group.total}
                </span>
              </div>
            </header>

            {group.tasks.length === 0 ? (
              <EmptyState
                title={group.emptyState.title}
                description={group.emptyState.description}
                actionHref={group.emptyState.actionHref}
                actionLabel={group.emptyState.actionLabel}
              />
            ) : (
              <ul className="space-y-3">
                {group.tasks.map((task, taskIndex) => (
                  <TaskRow key={task.id} task={task} index={taskIndex} />
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface TaskRowProps {
  task: AdminTaskItem
  index: number
}

function TaskRow({ task, index }: TaskRowProps) {
  const severity = severityConfig[task.severity]
  const Icon = severity.icon

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.25, 0.25, 1]
      }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(251, 191, 36, 0.4)' }}
      className="admin-panel-soft p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <span className={cn('rounded-[10px] p-2', severity.badge)}>
          <Icon className={cn('h-4 w-4', severity.tone)} />
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="truncate text-sm font-medium text-text-primary">
              {task.title}
            </h3>
            <span className="text-xs text-text-muted">
              {dateFormatter.format(task.createdAt)}
            </span>
          </div>
          {task.description ? (
            <p className="break-words text-sm font-light text-text-secondary">
              {task.description}
            </p>
          ) : null}
          {task.meta && task.meta.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[11px] text-text-muted">
              {task.meta.map((item, index) => (
                <span
                  key={`${task.id}-meta-${index}`}
                  className="admin-chip"
                >
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
          ) : null}
          {task.href ? (
            <a
              href={task.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              {task.actionLabel ?? '查看'}
            </a>
          ) : null}
        </div>
      </div>
    </motion.li>
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
    <div className="admin-panel-soft flex flex-col items-center gap-4 px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-emerald-200" />
      <div>
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <p className="mt-1 text-sm font-light text-text-secondary">
          {description}
        </p>
      </div>
      {actionHref && actionLabel ? (
        <a
          href={actionHref}
          className="text-xs font-medium text-amber-600 transition-colors hover:text-amber-500 hover:underline dark:text-amber-200 dark:hover:text-amber-100"
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  )
}

