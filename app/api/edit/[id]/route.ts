import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editId = params.id
    if (!editId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const edit = await db.editVersion.findUnique({
      where: { id: editId },
      include: { photo: true }
    })
    if (!edit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Enforce access: only owner can view private photo edits
    if (edit.photo.visibility === 'PRIVATE') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || session.user.id !== edit.photo.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const storage = getStorageManager()
    const url = await storage.getPresignedDownloadUrl(edit.fileKey)
    const resp = await fetch(url)
    if (!resp.ok) return NextResponse.json({ error: 'Storage fetch failed' }, { status: 502 })
    const buf = Buffer.from(await resp.arrayBuffer())
    const ct = resp.headers.get('content-type') || inferContentType(edit.fileKey)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': ct,
        'Content-Length': buf.length.toString(),
        'Cache-Control': edit.photo.visibility === 'PUBLIC' ? 'public, max-age=86400' : 'private, max-age=3600'
      }
    })
  } catch (e) {
    console.error('Edit serve error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function inferContentType(key: string): string {
  const lower = key.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.avif')) return 'image/avif'
  return 'image/jpeg'
}

