import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

import type { AdminRecentUploadItem } from '@/types/admin'
import { cn } from '@/lib/utils'

interface RecentUploadsPanelProps {
  items: AdminRecentUploadItem[]
}

export function RecentUploadsPanel({ items }: RecentUploadsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.5,
        ease: [0.25, 0.25, 0.25, 1]
      }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2
          className="admin-heading"
          style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
        >
          最近上传
        </h2>
        <span className="text-xs text-text-muted">
          最新 {items.length} 条记录
        </span>
      </div>

      <div className="admin-surface-card">
        {/* Film grain background */}
        <div
          className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />

        {items.length === 0 ? (
          <div className="relative flex flex-col items-center gap-3 py-12 text-center text-text-secondary">
            <p className="text-sm font-light text-text-secondary">
              暂无上传记录。
            </p>
          </div>
        ) : (
          <div className="relative grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <motion.figure
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1 + 0.2,
                  ease: [0.25, 0.25, 0.25, 1]
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={item.thumbUrl}
                    alt={item.title ?? 'Recent upload thumbnail'}
                    fill
                    sizes="(min-width: 1280px) 16vw, (min-width: 768px) 28vw, 80vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <figcaption className="flex items-center justify-between gap-3 p-4 text-text-primary">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.title ?? '未命名文件'}
                    </p>
                    <p className="truncate text-xs font-light text-text-secondary">
                      {item.albumTitle ?? '未归档'}
                    </p>
                  </div>
                  <VisibilityBadge visibility={item.visibility} />
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </motion.div>
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
      'inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] font-medium',
      isPublic
        ? 'border border-emerald-400/40 bg-emerald-400/15 text-emerald-600 dark:text-emerald-200'
        : 'border border-surface-outline/40 bg-surface-panel/70 text-text-secondary',
    )}>
      <Icon className="h-3 w-3" />
      {isPublic ? '公开' : '私密'}
    </span>
  )
}
