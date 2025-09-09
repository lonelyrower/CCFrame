import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.name === 'string') data.name = body.name.trim()
    if (typeof body.color === 'string') data.color = body.color.trim()
    if (!data.name && !data.color) return NextResponse.json({ error: 'No changes' }, { status: 400 })

    // If rename, check unique
    if (data.name) {
      const exists = await db.tag.findUnique({ where: { name: data.name } })
      if (exists && exists.id !== id) return NextResponse.json({ error: '已存在同名标签' }, { status: 409 })
    }

    const tag = await db.tag.update({ where: { id }, data })
    return NextResponse.json({ tag })
  } catch (e) {
    console.error('Tag update error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const url = new URL(req.url)
    const reassignTo = url.searchParams.get('reassignTo')

    if (reassignTo) {
      // Move assignments for current user's photos
      const pts = await db.photoTag.findMany({
        where: { tagId: id, photo: { userId: session.user.id } },
        select: { photoId: true }
      })
      for (const pt of pts) {
        try {
          await db.photoTag.upsert({
            where: { photoId_tagId: { photoId: pt.photoId, tagId: reassignTo } },
            update: {},
            create: { photoId: pt.photoId, tagId: reassignTo }
          })
        } catch {}
      }
    }

    // Delete the old tag (cascades PhotoTag)
    await db.tag.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Tag delete error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

