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
      include: { variants: true }
    })
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const storage = getStorageManager()
    const keys: string[] = photo.fileKey ? [photo.fileKey] : []
    for (const v of photo.variants) {
      if (v.fileKey) keys.push(v.fileKey)
    }
    // Edited versions are no longer tracked; only remove original + variants

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
    const stripLocation = process.env.EXIF_STRIP_GPS_PUBLIC === 'true'
    let out = updated as any
    if (stripLocation && updated.visibility === 'PUBLIC' && updated.exifJson) {
      let exif: any = null
      if (typeof updated.exifJson === 'string') {
        try {
          exif = JSON.parse(updated.exifJson)
        } catch {
          exif = null
        }
      } else if (typeof updated.exifJson === 'object') {
        exif = JSON.parse(JSON.stringify(updated.exifJson))
      }
      if (exif && typeof exif === 'object') {
        if (exif.location) delete exif.location
        out = { ...updated, exifJson: JSON.stringify(exif) }
      }
    }
    return NextResponse.json({ photo: out })
  } catch (e) {
    console.error('Update photo error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
