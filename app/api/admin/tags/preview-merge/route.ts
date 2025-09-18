import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const url = new URL(req.url)
    const sourceIds = (url.searchParams.getAll('sourceIds') || []).flatMap(v => v.split(',')).filter(Boolean)
    if (sourceIds.length === 0) return NextResponse.json({ affected: 0 })
    const pts = await db.photoTag.findMany({
      where: { tagId: { in: sourceIds }, photo: { userId: guard.adminUserId } },
      select: { photoId: true }
    })
    const unique = new Set(pts.map(x => x.photoId))
    return NextResponse.json({ affected: unique.size })
  } catch (e) {
    console.error('Tag merge preview error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
