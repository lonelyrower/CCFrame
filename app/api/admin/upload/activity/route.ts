import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getUploadActivityTimeline } from '@/lib/admin/upload-service'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 25
  const timeline = await getUploadActivityTimeline(limit)
  return NextResponse.json(timeline)
}
