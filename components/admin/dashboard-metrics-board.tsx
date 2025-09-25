import { Image, UploadCloud, AlertTriangle, HardDrive } from 'lucide-react'
import { motion } from 'framer-motion'

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
      gradientFrom: 'from-amber-100/20',
      gradientTo: 'to-amber-200/10',
      borderColor: 'border-amber-200/30',
      iconBg: 'bg-amber-100/20',
      iconColor: 'text-amber-200',
    },
    {
      id: 'uploads-active',
      title: '排队 / 处理中',
      value: numberFormatter.format(metrics.processing),
      caption: `${numberFormatter.format(metrics.recentUploads)} 条近 7 日新增`,
      icon: UploadCloud,
      gradientFrom: 'from-blue-400/20',
      gradientTo: 'to-sky-500/10',
      borderColor: 'border-blue-400/30',
      iconBg: 'bg-blue-400/20',
      iconColor: 'text-blue-200',
    },
    {
      id: 'uploads-failed',
      title: '失败任务',
      value: numberFormatter.format(metrics.failedUploads),
      caption: `${numberFormatter.format(taskSummary.critical)} 关键 · ${numberFormatter.format(taskSummary.warning)} 提醒`,
      icon: AlertTriangle,
      gradientFrom: 'from-red-400/20',
      gradientTo: 'to-orange-500/10',
      borderColor: 'border-red-400/30',
      iconBg: 'bg-red-400/20',
      iconColor: 'text-red-200',
    },
    {
      id: 'storage',
      title: '存储占用',
      value: formatBytes(metrics.storageUsedBytes),
      caption: `${numberFormatter.format(metrics.totalAlbums)} 个专辑`,
      icon: HardDrive,
      gradientFrom: 'from-emerald-400/20',
      gradientTo: 'to-green-500/10',
      borderColor: 'border-emerald-400/30',
      iconBg: 'bg-emerald-400/20',
      iconColor: 'text-emerald-200',
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            ease: [0.25, 0.25, 0.25, 1]
          }}
          whileHover={{
            scale: 1.02,
            borderColor: card.borderColor.replace('/30', '/50')
          }}
          className={`relative overflow-hidden rounded-[24px] border ${card.borderColor} bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} bg-black/40 p-6 backdrop-blur-xl shadow-xl transition-all duration-300`}
        >
          {/* Film grain background */}
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px'
            }}
          />

          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-medium text-white/90"
                style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
              >
                {card.title}
              </h3>
              <span className={`rounded-[12px] ${card.iconBg} p-2.5`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </span>
            </div>
            <div className="space-y-2">
              <p
                className="text-2xl font-light text-white tracking-tight"
                style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
              >
                {card.value}
              </p>
              <p className="text-xs font-light text-white/60">
                {card.caption}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
