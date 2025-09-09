import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const targetId: string | undefined = body.targetId
    const sourceIds: string[] = Array.isArray(body.sourceIds) ? body.sourceIds : []
    if (!targetId || sourceIds.length === 0) return NextResponse.json({ error: '参数无效' }, { status: 400 })

    for (const src of sourceIds) {
      if (src === targetId) continue
      const pts = await db.photoTag.findMany({ where: { tagId: src, photo: { userId: session.user.id } }, select: { photoId: true } })
      for (const pt of pts) {
        await db.photoTag.upsert({ where: { photoId_tagId: { photoId: pt.photoId, tagId: targetId } }, update: {}, create: { photoId: pt.photoId, tagId: targetId } })
      }
      await db.tag.delete({ where: { id: src } })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Tag merge error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

