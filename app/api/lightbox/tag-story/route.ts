import { NextResponse, type NextRequest } from 'next/server'

import { getTagStory } from '@/lib/lightbox/tag-story-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tagId = url.searchParams.get('tagId') ?? undefined
  const tagName = url.searchParams.get('tag') ?? undefined
  const photoId = url.searchParams.get('photoId') ?? undefined

  if (!tagId && !tagName) {
    return NextResponse.json({ error: 'tagId or tag parameter is required' }, { status: 400 })
  }

  try {
    const story = await getTagStory({ tagId, tagName, photoId })
    if (!story) {
      return NextResponse.json({ error: 'Tag story not found' }, { status: 404 })
    }
    return NextResponse.json({ story })
  } catch (error) {
    console.error('[api/lightbox/tag-story] failed', error)
    return NextResponse.json({ error: 'Failed to load tag story' }, { status: 500 })
  }
}
