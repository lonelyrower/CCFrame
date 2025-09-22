import { NextResponse, type NextRequest } from 'next/server'

import { getStorySequenceForPhoto } from '@/lib/lightbox/story-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const photoId = url.searchParams.get('id')
  const contextRaw = url.searchParams.get('context') ?? 'catalog'

  if (!photoId) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
  }

  const context = (['catalog', 'collection', 'album'] as const).includes(contextRaw as any)
    ? (contextRaw as 'catalog' | 'collection' | 'album')
    : 'catalog'

  try {
    const sequence = await getStorySequenceForPhoto(photoId, context)
    if (!sequence) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    return NextResponse.json({ sequence })
  } catch (error) {
    console.error('[api/lightbox/story] failed', error)
    return NextResponse.json({ error: 'Failed to load story sequence' }, { status: 500 })
  }
}
