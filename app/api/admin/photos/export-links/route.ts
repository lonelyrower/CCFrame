import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 500) : []
    const variant: string = body.variant || 'large'
    const format: string = (body.format || 'jpeg').toLowerCase()
    if (ids.length === 0) return NextResponse.json({ error: 'No ids' }, { status: 400 })

    const photos = await db.photo.findMany({ where: { id: { in: ids }, userId: session.user.id }, include: { variants: true } })
    const storage = getStorageManager()
    const lines: string[] = []
    for (const p of photos) {
      let key = ''
      const rec = p.variants.find(v => v.variant === variant && v.format === format) || p.variants.find(v => v.variant === variant) || p.variants.find(v => v.variant === 'large')
      if (rec && rec.fileKey) key = rec.fileKey
      else if (p.fileKey) key = p.fileKey

      if (key) {
        try {
          const url = await storage.getPresignedDownloadUrl(key)
          lines.push(url)
        } catch {
          // skip
        }
      }
    }
    const content = lines.join('\n') + '\n'
    return new NextResponse(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    console.error('Export links error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

