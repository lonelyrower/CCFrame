import { Heading, Text } from '@/components/ui/typography'
import { getDashboardSnapshot } from '@/lib/admin/dashboard-service'
import { DashboardMetricsBoard } from '@/components/admin/dashboard-metrics-board'
import { TaskHub } from '@/components/admin/task-hub'
import { ActivityStream } from '@/components/admin/activity-stream'
import { RecentUploadsPanel } from '@/components/admin/recent-uploads-panel'

export const revalidate = 30

export default async function AdminDashboardPage() {
  const snapshot = await getDashboardSnapshot()

  return (
    <div className="space-y-10 pb-20 pt-6">
      <header className="space-y-2">
        <Heading size="lg">工作台</Heading>
        <Text tone="secondary">
          快速了解上传状态、待办与系统健康，保持内容与配置同步。
        </Text>
      </header>

      <DashboardMetricsBoard metrics={snapshot.metrics} taskSummary={snapshot.taskCenter.summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TaskHub groups={snapshot.taskCenter.groups} />
        <ActivityStream items={snapshot.activity} />
      </div>

      <RecentUploadsPanel items={snapshot.recentUploads} />
    </div>
  )
}

