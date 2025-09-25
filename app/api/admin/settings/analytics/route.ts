import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getAnalyticsSettings, updateAnalyticsSettings } from '@/lib/admin/settings-service'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const settings = await getAnalyticsSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  try {
    const updated = await updateAnalyticsSettings({
      enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
      googleAnalyticsId: typeof body.googleAnalyticsId === 'string' ? body.googleAnalyticsId : undefined,
      microsoftClarityId: typeof body.microsoftClarityId === 'string' ? body.microsoftClarityId : undefined,
    })
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}