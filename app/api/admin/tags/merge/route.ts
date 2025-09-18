import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await req.json().catch(() => ({}))
    const targetId: string | undefined = body.targetId
    const sourceIds: string[] = Array.isArray(body.sourceIds) ? body.sourceIds : []
    if (!targetId || sourceIds.length === 0) return NextResponse.json({ error: '请求无效' }, { status: 400 })

    await db.$transaction(async (tx) => {
      for (const src of sourceIds) {
        if (src === targetId) continue

        const pts = await tx.photoTag.findMany({
          where: { tagId: src, photo: { userId: guard.adminUserId } },
          select: { photoId: true }
        })

        for (const pt of pts) {
          await tx.photoTag.upsert({
            where: { photoId_tagId: { photoId: pt.photoId, tagId: targetId } },
            update: {},
            create: { photoId: pt.photoId, tagId: targetId }
          })
        }

        await tx.tag.delete({ where: { id: src } })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Tag merge error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
