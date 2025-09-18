import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { buildPhotoWhereFromRule, SmartRule } from '@/lib/smart-albums'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const id = params.id
    const url = new URL(req.url)
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
    const album = await db.smartAlbum.findFirst({ where: { id, userId: guard.adminUserId } })
    if (!album) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const rule = (album.ruleJson as any) as SmartRule
    const where = buildPhotoWhereFromRule(rule || {}, guard.adminUserId)
    const [items, total] = await Promise.all([
      db.photo.findMany({ where, include: { variants: true, tags: { include: { tag: true } }, album: true }, orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
      db.photo.count({ where })
    ])
    return NextResponse.json({ photos: items, total })
  } catch (e) {
    console.error('Smart album photos error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
