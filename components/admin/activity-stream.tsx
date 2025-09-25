import { AlertTriangle, Camera, FileWarning, LogIn, UploadCloud, Folder } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.4,
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
        <h2
          className="admin-heading"
          style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
        >
          最新活动
        </h2>
        {items.length === 0 ? (
          <div className="admin-panel-soft flex items-center justify-center px-4 py-10 text-center">
            <p className="text-sm font-light text-text-secondary">
              暂无活动记录。
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.25, 0.25, 0.25, 1]
                }}
                whileHover={{ scale: 1.01, borderColor: 'rgba(251, 191, 36, 0.3)' }}
                className="admin-panel-soft p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/40"
              >
                <div className="flex gap-3">
                  <ActivityIcon iconKey={item.icon} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-medium text-text-primary">
                        {item.title}
                      </h3>
                      <span className="text-xs text-text-muted">
                        {dateFormatter.format(item.timestamp)}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="mt-1 break-words text-sm font-light text-text-secondary">
                        {item.description}
                      </p>
                    ) : null}
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-2 inline-flex text-xs font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        查看详情
                      </a>
                    ) : null}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

interface ActivityIconProps {
  iconKey?: string
}

function ActivityIcon({ iconKey }: ActivityIconProps) {
  const Icon = (iconKey && iconMap[iconKey]) || UploadCloud
  return (
    <span className="rounded-[10px] bg-amber-100/20 p-2">
      <Icon className="h-4 w-4 text-amber-200" />
    </span>
  )
}
