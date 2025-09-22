import { formatDate, getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'
import type { StorySequence, StoryEntry } from '@/types/lightbox'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

interface BuildStoryOptions {
  id?: string
  title?: string
  description?: string | null
  mode?: 'horizontal' | 'vertical'
  audioSrc?: string | null
}

function accentColorFromTag(tagName?: string | null): string | undefined {
  if (!tagName) return undefined
  let hash = 0
  for (let i = 0; i < tagName.length; i += 1) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 68%, 42%)`
}

function createEntryFromPhoto(photo: PhotoWithDetails): StoryEntry {
  const primaryTag = photo.tags?.[0]?.tag
  const title = photo.title || primaryTag?.name || photo.album?.title || '未命名章节'
  const subtitle = photo.album?.title ? `来自专辑 · ${photo.album.title}` : primaryTag?.name || undefined
  const timestamp = photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.createdAt ?? new Date())

  return {
    id: photo.id,
    title,
    subtitle,
    description: photo.description ?? null,
    photoId: photo.id,
    mediaType: 'photo',
    thumbnailUrl: getImageUrl(photo.id, 'medium', 'webp'),
    width: photo.width ?? null,
    height: photo.height ?? null,
    notes: photo.description ?? undefined,
    accentColor: accentColorFromTag(primaryTag?.name),
    timestamp,
  }
}

export function buildStorySequence(photos: PhotoWithDetails[], options: BuildStoryOptions = {}): StorySequence {
  const titleFromAlbum = photos[0]?.album?.title
  const sequenceTitle = options.title || titleFromAlbum || '造型故事集'
  const sequenceDescription = options.description || photos[0]?.album?.description || null
  const entries = photos.map((photo) => createEntryFromPhoto(photo))

  return {
    id: options.id || `auto-sequence-${photos[0]?.albumId ?? 'default'}`,
    title: sequenceTitle,
    description: sequenceDescription,
    entries,
    mode: options.mode || 'horizontal',
    audioSrc: options.audioSrc ?? null,
    tags: photos[0]?.tags?.map(({ tag }) => tag.name) ?? [],
  }
}

export function findEntryIndex(sequence: StorySequence | null, photoId?: string | null): number {
  if (!sequence || !photoId) return -1
  return sequence.entries.findIndex((entry) => entry.photoId === photoId)
}

type StoryContext = 'catalog' | 'collection' | 'album'

const STORY_INCLUDE = {
  album: true,
  tags: {
    include: {
      tag: true,
    },
  },
  variants: true,
  faces: true,
  albumCovers: true,
  smartAlbumCovers: true,
} satisfies Prisma.PhotoInclude

function buildStoryWhere(base: Prisma.PhotoWhereInput, photo: PhotoWithDetails): Prisma.PhotoWhereInput {
  if (photo.albumId) {
    return {
      ...base,
      albumId: photo.albumId,
    }
  }

  const primaryTag = photo.tags?.[0]?.tag
  if (primaryTag) {
    return {
      ...base,
      tags: {
        some: {
          tagId: primaryTag.id,
        },
      },
    }
  }

  return base
}

export async function getStorySequenceForPhoto(photoId: string, context: StoryContext = 'catalog'): Promise<StorySequence | null> {
  const photo = (await db.photo.findUnique({
    where: { id: photoId },
    include: STORY_INCLUDE,
  })) as unknown as PhotoWithDetails | null

  if (!photo || photo.status !== 'COMPLETED') {
    return null
  }

  const baseWhere: Prisma.PhotoWhereInput = {
    status: 'COMPLETED',
  }

  if (context === 'catalog') {
    baseWhere.visibility = 'PUBLIC'
  }

  const storyWhere = buildStoryWhere(baseWhere, photo)

  const relatedPhotos = (await db.photo.findMany({
    where: storyWhere,
    include: STORY_INCLUDE,
    orderBy: [
      { takenAt: 'asc' as const },
      { createdAt: 'asc' as const },
    ],
    take: 24,
  })) as unknown as PhotoWithDetails[]

  const ordered = [photo, ...relatedPhotos]
  const unique = new Map<string, PhotoWithDetails>()
  ordered.forEach((item) => {
    if (!unique.has(item.id)) {
      unique.set(item.id, item)
    }
  })

  const sequencePhotos = Array.from(unique.values())
  if (sequencePhotos.length === 0) {
    return null
  }

  const mode: StorySequence['mode'] = photo.album?.title ? 'horizontal' : 'vertical'
  const title = photo.album?.title ?? `#${photo.tags?.[0]?.tag?.name ?? 'Story'}`
  const description = photo.album?.description ?? photo.description ?? null

  return buildStorySequence(sequencePhotos, {
    id: photo.albumId ? `album-${photo.albumId}` : `story-${photo.id}`,
    title,
    description,
    mode,
  })
}
