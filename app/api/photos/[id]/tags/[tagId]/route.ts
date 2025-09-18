import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: { id: string, tagId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const photo = await db.photo.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    await db.photoTag.delete({ where: { photoId_tagId: { photoId: photo.id, tagId: params.tagId } } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to detach tag' }, { status: 500 })
  }
}
