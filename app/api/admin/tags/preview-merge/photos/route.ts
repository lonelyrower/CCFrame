import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const sourceIds = (url.searchParams.getAll('sourceIds') || []).flatMap(v => v.split(',')).filter(Boolean)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 48)
    if (sourceIds.length === 0) return NextResponse.json({ photos: [] })
    const pts = await db.photoTag.findMany({ where: { tagId: { in: sourceIds }, photo: { userId: session.user.id } }, select: { photoId: true }, take: 500 })
    const ids = Array.from(new Set(pts.map(x => x.photoId))).slice(0, limit)
    return NextResponse.json({ photos: ids })
  } catch (e) {
    console.error('Tag merge photos preview error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

