import { getDashboardSnapshot } from '@/lib/admin/dashboard-service'
import { DashboardMetricsBoard } from '@/components/admin/dashboard-metrics-board'
import { TaskHub } from '@/components/admin/task-hub'
import { ActivityStream } from '@/components/admin/activity-stream'
import { RecentUploadsPanel } from '@/components/admin/recent-uploads-panel'

export const revalidate = 30

export default async function AdminDashboardPage() {
  const snapshot = await getDashboardSnapshot()

  return (
    <div className="relative space-y-8 pb-20 pt-6">
      {/* Film grain background */}
      <div
        className="fixed inset-0 opacity-5 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <header className="relative space-y-3">
        <h1
          className="text-3xl font-light text-white tracking-tight"
          style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
        >
          工作台
        </h1>
        <p className="text-white/70 font-light leading-relaxed">
          快速了解上传状态、待办与系统健康，保持内容与配置同步。
        </p>
      </header>

      <DashboardMetricsBoard metrics={snapshot.metrics} taskSummary={snapshot.taskCenter.summary} />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TaskHub groups={snapshot.taskCenter.groups} />
        <ActivityStream items={snapshot.activity} />
      </div>

      <RecentUploadsPanel items={snapshot.recentUploads} />
    </div>
  )
}

