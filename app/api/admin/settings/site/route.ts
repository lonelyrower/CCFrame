import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getSiteSettings, updateSiteSettings } from '@/lib/admin/settings-service'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const settings = await getSiteSettings()
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
    const updated = await updateSiteSettings({
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      defaultVisibility: body.defaultVisibility === 'PRIVATE' ? 'PRIVATE' : body.defaultVisibility === 'PUBLIC' ? 'PUBLIC' : undefined,
      allowPublicAccess: typeof body.allowPublicAccess === 'boolean' ? body.allowPublicAccess : undefined,
    })
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
