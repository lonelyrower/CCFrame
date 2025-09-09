import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = params.id
    const photo = await db.photo.findFirst({
      where: { id, userId: session.user.id },
      include: { variants: true, editVersions: true }
    })
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const storage = getStorageManager()
    const keys: string[] = [photo.fileKey]
    for (const v of photo.variants) keys.push(v.fileKey)
    for (const e of photo.editVersions) keys.push(e.fileKey)

    // Delete DB first to avoid dangling references on failure
    await db.photo.delete({ where: { id } })

    // Delete storage objects best-effort
    await Promise.all(keys.map(async (k) => {
      try { await storage.deleteObject(k) } catch {}
    }))

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Delete photo error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.visibility === 'string') data.visibility = body.visibility
    if (Object.prototype.hasOwnProperty.call(body, 'albumId')) {
      if (body.albumId === null) {
        data.albumId = null
      } else if (typeof body.albumId === 'string' && body.albumId.length > 0) {
        // Ensure album belongs to the same user
        const album = await db.album.findFirst({ where: { id: body.albumId, userId: session.user.id }, select: { id: true } })
        if (!album) return NextResponse.json({ error: 'Album not found' }, { status: 404 })
        data.albumId = body.albumId
      }
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: 'No changes' }, { status: 400 })
    const photo = await db.photo.findFirst({ where: { id, userId: session.user.id } })
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await db.photo.update({ where: { id }, data })
    return NextResponse.json({ photo: updated })
  } catch (e) {
    console.error('Update photo error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
