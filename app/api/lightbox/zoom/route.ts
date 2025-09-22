import { NextResponse, type NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { getZoomSources } from '@/lib/lightbox/zoom-service'

export const dynamic = 'force-dynamic'

function filterByLevel(sources: ReturnType<typeof getZoomSources>, level?: number) {
  if (!level || Number.isNaN(level)) return sources
  const target = Math.max(1, Math.min(level, sources.length))
  return sources.slice(target - 1)
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const levelParam = url.searchParams.get('level')

  if (!id) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
  }

  const level = levelParam ? Number(levelParam) : undefined

  try {
    const photo = await db.photo.findUnique({
      where: { id },
      include: { variants: true },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const sources = getZoomSources(photo as any)
    const filtered = filterByLevel(sources, level)

    if (filtered.length === 0) {
      return NextResponse.json({ error: 'Zoom sources unavailable' }, { status: 404 })
    }

    return NextResponse.json({ sources: filtered })
  } catch (error) {
    console.error('[api/lightbox/zoom] failed', error)
    return NextResponse.json({ error: 'Failed to load zoom sources' }, { status: 500 })
  }
}
