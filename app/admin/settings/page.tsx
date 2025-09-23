import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

import { requireAdmin } from '@/lib/admin-auth'
import { getAdminSettingsOverview } from '@/lib/admin/settings-service'
import { SettingsWizard } from '@/components/admin/settings-wizard'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) {
    if (guard.status === 401) redirect('/admin/login')
    if (guard.status === 403) redirect('/admin/login?error=forbidden')
    throw new Error('Admin access required')
  }

  const overview = await getAdminSettingsOverview(guard.adminUserId)

  return (
    <div className="space-y-10 pb-20 pt-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-text-primary">设置中心</h1>
        <p className="text-sm text-text-secondary">
          通过向导完成站点、存储、接口与语义检索配置，保持后台运行健康。
        </p>
      </div>
      <SettingsWizard initialData={overview} />
    </div>
  )
}
