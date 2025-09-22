import { NextResponse, type NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { buildCatalogHref, catalogNumberFormatter } from '@/lib/catalog-data'
import type { CatalogRecommendationItem } from '@/types/catalog'
import { getTagStory } from '@/lib/lightbox/tag-story-service'

export const dynamic = 'force-dynamic'

async function buildStoryRecommendations(
  tagId: string,
  tagName: string,
  summary: string,
  photoCount: number,
  accentColor: string | null | undefined,
  related: string[],
): Promise<CatalogRecommendationItem[]> {
  const items: CatalogRecommendationItem[] = []

  const baseItem: CatalogRecommendationItem = {
    id: `story-primary-${tagId}`,
    title: `#${tagName}`,
    description: summary,
    href: buildCatalogHref({ tags: [tagName] }),
    badge: '标签故事',
    stats: `${catalogNumberFormatter.format(photoCount)} 张作品`,
    accentColor: accentColor ?? undefined,
    patch: {
      tags: [tagName],
      album: null,
      colors: [],
      search: null,
    },
  }

  items.push(baseItem)

  if (related.length === 0) {
    return items
  }

  const relatedTags = await db.tag.findMany({
    where: {
      name: {
        in: related,
      },
    },
  })

  const counts = await Promise.all(
    relatedTags.map((tag) =>
      db.photo.count({
        where: {
          visibility: 'PUBLIC',
          status: 'COMPLETED',
          tags: {
            some: {
              tagId: tag.id,
            },
          },
        },
      }),
    ),
  )

  relatedTags.forEach((tag, index) => {
    items.push({
      id: `story-related-${tag.id}`,
      title: `#${tag.name}`,
      description: `继续浏览 #${tag.name} 相关的造型与情绪片段。`,
      href: buildCatalogHref({ tags: [tag.name] }),
      badge: '相关标签',
      stats: `${catalogNumberFormatter.format(counts[index] ?? 0)} 张作品`,
      accentColor: tag.color ?? undefined,
      patch: {
        tags: [tag.name],
        album: null,
        colors: [],
        search: null,
      },
    })
  })

  return items
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const context = url.searchParams.get('context') ?? 'default'

  if (context !== 'story') {
    return NextResponse.json({ error: 'Unsupported context' }, { status: 400 })
  }

  const tagId = url.searchParams.get('tagId') ?? undefined
  const tagName = url.searchParams.get('tag') ?? undefined
  const photoId = url.searchParams.get('photoId') ?? undefined

  if (!tagId && !tagName) {
    return NextResponse.json({ error: 'tagId or tag parameter is required' }, { status: 400 })
  }

  try {
    const story = await getTagStory({ tagId: tagId ?? undefined, tagName: tagName ?? undefined, photoId: photoId ?? undefined })
    if (!story) {
      return NextResponse.json({ error: 'Tag story not found' }, { status: 404 })
    }

    const recommendations = await buildStoryRecommendations(
      story.tagId,
      story.tagName,
      story.summary,
      story.photoCount,
      story.accentColor,
      story.relatedTags,
    )

    return NextResponse.json({ story, recommendations })
  } catch (error) {
    console.error('[api/catalog/recommendations] failed', error)
    return NextResponse.json({ error: 'Failed to build recommendations' }, { status: 500 })
  }
}
