import type { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import { buildCatalogHref, catalogNumberFormatter } from '@/lib/catalog-data'
import { getImageUrl } from '@/lib/utils'
import type { TagStory } from '@/types/lightbox'

interface TagStoryRequest {
  tagId?: string
  tagName?: string
  photoId?: string
}

function buildSummary(tagName: string, photoCount: number, albumTitle?: string | null): string {
  const parts: string[] = []
  if (albumTitle) {
    parts.push(`节选自《${albumTitle}》系列`)
  }
  const formattedCount = catalogNumberFormatter.format(Math.max(photoCount, 0))
  const countText = photoCount > 0 ? `${formattedCount} 张作品` : '即将上线的作品集'
  parts.push(`#${tagName} 的故事 · ${countText}`)
  return parts.join(' · ')
}

export async function getTagStory(params: TagStoryRequest): Promise<TagStory | null> {
  const { tagId, tagName, photoId } = params
  if (!tagId && !tagName) {
    throw new Error('tagId or tagName is required')
  }

  const tagWhere: Prisma.TagWhereUniqueInput = tagId
    ? { id: tagId }
    : { name: (tagName ?? '').trim() }

  const tag = await db.tag.findUnique({
    where: tagWhere,
  })

  if (!tag) {
    return null
  }

  const photoWhere: Prisma.PhotoWhereInput = {
    visibility: 'PUBLIC',
    status: 'COMPLETED',
    tags: {
      some: {
        tagId: tag.id,
      },
    },
  }

  const photoCount = await db.photo.count({ where: photoWhere })

  let highlightPhoto = null

  if (photoId) {
    highlightPhoto = await db.photo.findFirst({
      where: {
        ...photoWhere,
        id: photoId,
      },
      include: {
        album: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
  }

  if (!highlightPhoto) {
    highlightPhoto = await db.photo.findFirst({
      where: photoWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        album: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
  }

  const albumTitle = highlightPhoto?.album?.title ?? null
  const summary = buildSummary(tag.name, photoCount, albumTitle)
  const relatedTags = Array.from(
    new Set(
      highlightPhoto?.tags
        ?.map(({ tag: related }) => related.name)
        .filter((name) => name && name.toLowerCase() !== tag.name.toLowerCase()) ?? [],
    ),
  ).slice(0, 3)

  const href = buildCatalogHref({ tags: [tag.name] })

  return {
    id: `tag-story-${tag.id}`,
    tagId: tag.id,
    tagName: tag.name,
    accentColor: tag.color,
    summary,
    source: albumTitle ? `专辑 · ${albumTitle}` : '标签故事',
    photoCount,
    highlightPhoto: highlightPhoto
      ? {
          id: highlightPhoto.id,
          src: getImageUrl(highlightPhoto.id, 'medium', 'webp'),
          width: highlightPhoto.width,
          height: highlightPhoto.height,
        }
      : undefined,
    relatedTags,
    cta: {
      label: `查看 #${tag.name} 推荐`,
      href,
      patch: {
        tags: [tag.name],
        album: null,
        colors: [],
        search: null,
      },
    },
    updatedAt: highlightPhoto?.updatedAt?.toISOString?.(),
  }
}
