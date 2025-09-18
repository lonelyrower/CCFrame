import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { buildPhotoWhereFromRule } from '@/lib/smart-albums'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const url = new URL(req.url)
    const withCounts = url.searchParams.get('withCounts') === '1'

    const items = await db.smartAlbum.findMany({ where: { userId: guard.adminUserId }, orderBy: { updatedAt: 'desc' } })
    if (!withCounts) return NextResponse.json({ albums: items })

    // 遍历匹配规则统计用户的当前照片数量，如有慢查询应考虑优化为批量
    const albumsWithCounts = [] as any[]
    for (const a of items) {
      try {
        const rule = (a.ruleJson as any) || {}
        const where = buildPhotoWhereFromRule(rule, guard.adminUserId)
        const count = await db.photo.count({ where })
        albumsWithCounts.push({ ...a, _count: { photos: count } })
      } catch {
        albumsWithCounts.push({ ...a, _count: { photos: 0 } })
      }
    }
    return NextResponse.json({ albums: albumsWithCounts })
  } catch (e) {
    console.error('Smart albums list error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await req.json().catch(() => ({}))
    const title = (body.title || '').trim()
    const description = (body.description || '').trim()
    const rule = body.rule || {}
    if (!title) return NextResponse.json({ error: '名称必填' }, { status: 400 })
    const album = await db.smartAlbum.create({ data: { title, description: description || null, ruleJson: rule as any, userId: guard.adminUserId, visibility: 'PRIVATE' } })
    return NextResponse.json({ album }, { status: 201 })
  } catch (e) {
    console.error('Smart album create error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
