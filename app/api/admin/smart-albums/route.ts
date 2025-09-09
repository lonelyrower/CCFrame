import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildPhotoWhereFromRule } from '@/lib/smart-albums'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const withCounts = url.searchParams.get('withCounts') === '1'

    const items = await db.smartAlbum.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: 'desc' } })
    if (!withCounts) return NextResponse.json({ albums: items })

    // 计算匹配数量（私人项目场景下串行即可；如需可优化为并行）
    const albumsWithCounts = [] as any[]
    for (const a of items) {
      try {
        const rule = (a.ruleJson as any) || {}
        const where = buildPhotoWhereFromRule(rule, session.user.id)
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const title = (body.title || '').trim()
    const description = (body.description || '').trim()
    const rule = body.rule || {}
    if (!title) return NextResponse.json({ error: '标题必填' }, { status: 400 })
    const album = await db.smartAlbum.create({ data: { title, description: description || null, ruleJson: rule as any, userId: session.user.id, visibility: 'PRIVATE' } })
    return NextResponse.json({ album }, { status: 201 })
  } catch (e) {
    console.error('Smart album create error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
