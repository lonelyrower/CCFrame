import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { updateIntegrationSettings } from '@/lib/admin/settings-service'

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  const pixabayApiKey = typeof body.pixabayApiKey === 'string' ? body.pixabayApiKey.trim() : ''
  const defaultSeedCount = Number(body.defaultSeedCount ?? 0)

  try {
    const updated = await updateIntegrationSettings(guard.adminUserId, {
      pixabayApiKey,
      defaultSeedCount: Number.isFinite(defaultSeedCount) ? defaultSeedCount : 12,
    })
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
