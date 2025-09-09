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
    if (sourceIds.length === 0) return NextResponse.json({ affected: 0 })
    const pts = await db.photoTag.findMany({
      where: { tagId: { in: sourceIds }, photo: { userId: session.user.id } },
      select: { photoId: true }
    })
    const unique = new Set(pts.map(x => x.photoId))
    return NextResponse.json({ affected: unique.size })
  } catch (e) {
    console.error('Tag merge preview error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

