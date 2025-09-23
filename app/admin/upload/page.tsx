import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

import { requireAdmin } from '@/lib/admin-auth'
import { getUploadActivityTimeline, getUploadQueueSnapshot } from '@/lib/admin/upload-service'
import { Heading, Text } from '@/components/ui/typography'
import { UploadQueuePanel } from '@/components/admin/upload-queue-panel'
import { UploadActivityTimeline } from '@/components/admin/upload-activity-timeline'
import { UploadGuard } from '@/components/admin/upload-guard'
import { UploadInterface } from '@/components/admin/upload-interface'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) {
    if (guard.status === 401) redirect('/admin/login')
    if (guard.status === 403) redirect('/admin/login?error=forbidden')
    throw new Error('Admin access required')
  }

  const [snapshot, timeline] = await Promise.all([
    getUploadQueueSnapshot(),
    getUploadActivityTimeline(),
  ])

  return (
    <div className="space-y-10 pb-20 pt-6">
      <section className="space-y-6">
        <div className="space-y-2">
          <Heading size="lg">上传中心</Heading>
          <Text tone="secondary">
            管理上传队列，查看实时处理状态，并快速排查异常任务。
          </Text>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <UploadQueuePanel initialData={snapshot} />
          <div className="space-y-4">
            <UploadGuard guard={snapshot.guard} />
            <UploadActivityTimeline initialData={timeline} />
          </div>
        </div>
      </section>

      <UploadInterface />
    </div>
  )
}
