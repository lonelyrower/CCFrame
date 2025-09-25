'use client'

import { DashboardMetricsBoard } from '@/components/admin/dashboard-metrics-board'
import { TaskHub } from '@/components/admin/task-hub'
import { ActivityStream } from '@/components/admin/activity-stream'
import { RecentUploadsPanel } from '@/components/admin/recent-uploads-panel'
import { PixabayImportPanel } from '@/components/admin/pixabay-import-panel'

export default function AdminDashboardPage() {
  // Mock snapshot data for client-side rendering
  const snapshot = {
    metrics: {
      totalPhotos: 0,
      totalAlbums: 0,
      totalTags: 0,
      totalViews: 0,
      storageUsed: 0,
      todaysUploads: 0,
      publicPhotos: 0,
      privatePhotos: 0,
      processing: 0,
      failedUploads: 0,
      storageTotal: 0,
      storagePercent: 0,
      recentUploads: 0,
      storageUsedBytes: 0,
    },
    recentUploads: [],
    activities: [],
    tasks: [],
    taskCenter: {
      summary: {
        total: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalPending: 0,
        critical: 0,
        warning: 0,
      },
      groups: [],
    },
    activity: [],
  }

  return (
    <div className="relative space-y-8 pb-20 pt-6 text-text-primary">
      {/* Film grain background */}
      <div
        className="fixed inset-0 opacity-5 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <header className="relative space-y-3 text-text-primary">
        <h1
          className="text-3xl font-light tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
        >
          工作台
        </h1>
        <p className="font-light leading-relaxed text-text-secondary">
          快速了解上传状态、待办与系统健康，保持内容与配置同步。
        </p>
      </header>

      <DashboardMetricsBoard metrics={snapshot.metrics} taskSummary={snapshot.taskCenter.summary} />

      <PixabayImportPanel />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TaskHub groups={snapshot.taskCenter.groups} />
        <ActivityStream items={snapshot.activity} />
      </div>

      <RecentUploadsPanel items={snapshot.recentUploads} />
    </div>
  )
}

