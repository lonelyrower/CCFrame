import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoTagPhoto } from '@/lib/auto-tag'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const photoId: string | undefined = body.photoId
    const albumId: string | undefined = body.albumId
    const limit: number = Math.min(Math.max(parseInt(body.limit || '50', 10), 1), 500)
    const includeColors = body.include?.colors !== false
    const includeContent = body.include?.content !== false

    let photoIds: string[] = []
    if (photoId) {
      const p = await db.photo.findFirst({ where: { id: photoId, userId: session.user.id, status: 'COMPLETED' }, select: { id: true } })
      if (!p) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
      photoIds = [p.id]
    } else if (albumId) {
      const items = await db.photo.findMany({ where: { albumId, userId: session.user.id, status: 'COMPLETED' }, select: { id: true }, take: limit })
      photoIds = items.map(x => x.id)
    } else {
      const items = await db.photo.findMany({ where: { userId: session.user.id, status: 'COMPLETED' }, select: { id: true }, orderBy: { createdAt: 'desc' }, take: limit })
      photoIds = items.map(x => x.id)
    }

    let processed = 0
    for (const id of photoIds) {
      try {
        await autoTagPhoto(id, { includeColors, includeContent })
        processed++
      } catch (e) {
        console.warn('Auto-tag one failed:', e)
      }
    }

    return NextResponse.json({ processed, total: photoIds.length })
  } catch (e) {
    console.error('Auto-tag error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

