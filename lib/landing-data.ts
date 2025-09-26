import { PHOTO_STATUS, type PhotoStatus, VISIBILITY } from '@/lib/constants'
import { db, isDatabaseConfigured } from '@/lib/db'
import type { PhotoWithDetails } from '@/types'

const PUBLIC_COMPLETED_WHERE = {
  visibility: VISIBILITY.PUBLIC,
  status: PHOTO_STATUS.COMPLETED,
} as const

export interface LandingMetricsSnapshot {
  totalPhotos: number
  totalTags: number
  totalAlbums: number
  recentPhotosCount: number
}

export interface LandingAlbumHighlight {
  id: string
  title: string
  description?: string | null
  photoCount: number
  coverPhoto?: PhotoWithDetails | null
}

export interface LandingTagHighlight {
  id: string
  name: string
  color: string
  photoCount: number
}

export interface LandingPipelineSnapshot {
  totals: Record<PhotoStatus, number>
  totalActive: number
}

export interface LandingActivityItem {
  id: string
  createdAt: Date
  status: PhotoStatus | string
  album?: {
    id: string
    title: string | null
  } | null
  tags: Array<{
    id: string
    name: string
    color: string
  }>
}

export interface LandingSnapshot {
  metrics: LandingMetricsSnapshot
  featuredPhotos: PhotoWithDetails[]
  topAlbums: LandingAlbumHighlight[]
  topTags: LandingTagHighlight[]
  pipeline: LandingPipelineSnapshot
  recentActivity: LandingActivityItem[]
}

const EMPTY_PIPELINE_TOTALS: Record<PhotoStatus, number> = {
  [PHOTO_STATUS.UPLOADING]: 0,
  [PHOTO_STATUS.PROCESSING]: 0,
  [PHOTO_STATUS.COMPLETED]: 0,
  [PHOTO_STATUS.FAILED]: 0,
}

const EMPTY_SNAPSHOT: LandingSnapshot = {
  metrics: {
    totalPhotos: 0,
    totalTags: 0,
    totalAlbums: 0,
    recentPhotosCount: 0,
  },
  featuredPhotos: [],
  topAlbums: [],
  topTags: [],
  pipeline: {
    totals: { ...EMPTY_PIPELINE_TOTALS },
    totalActive: 0,
  },
  recentActivity: [],
}

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  if (!isDatabaseConfigured) {
    console.warn('[landing-data] Database not configured, returning empty snapshot')
    return EMPTY_SNAPSHOT
  }

  try {
    const [featuredPhotos, metrics, topAlbums, topTags, pipeline, recentActivity] = await Promise.all([
      fetchFeaturedPhotos().catch(err => {
        console.error('[landing-data] fetchFeaturedPhotos failed:', err)
        return []
      }),
      fetchMetrics().catch(err => {
        console.error('[landing-data] fetchMetrics failed:', err)
        return { totalPhotos: 0, totalTags: 0, totalAlbums: 0, recentPhotosCount: 0 }
      }),
      fetchTopAlbums().catch(err => {
        console.error('[landing-data] fetchTopAlbums failed:', err)
        return []
      }),
      fetchTopTags().catch(err => {
        console.error('[landing-data] fetchTopTags failed:', err)
        return []
      }),
      fetchPipelineSnapshot().catch(err => {
        console.error('[landing-data] fetchPipelineSnapshot failed:', err)
        return { totals: {} as any, totalActive: 0 }
      }),
      fetchRecentActivity().catch(err => {
        console.error('[landing-data] fetchRecentActivity failed:', err)
        return []
      }),
    ])

    return {
      metrics,
      featuredPhotos,
      topAlbums,
      topTags,
      pipeline,
      recentActivity,
    }
  } catch (error) {
    console.error('[landing-data] getLandingSnapshot failed:', error)
    
    // 在生产环境中，返回空快照而不是抛出错误
    if (process.env.NODE_ENV === 'production') {
      return EMPTY_SNAPSHOT
    }
    
    // 在开发环境中，抛出错误以便调试
    throw error
  }
}

async function fetchFeaturedPhotos(): Promise<PhotoWithDetails[]> {
  try {
    const photos = await db.photo.findMany({
      where: PUBLIC_COMPLETED_WHERE,
      include: {
        variants: true,
        tags: {
          include: {
            tag: true,
          },
        },
        album: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 18,
    })

    return photos as unknown as PhotoWithDetails[]
  } catch (error) {
    console.error('[landing-data] fetchFeaturedPhotos database error:', error)
    throw new Error(`Failed to fetch featured photos: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function fetchMetrics(): Promise<LandingMetricsSnapshot> {
  const [totalPhotos, totalTags, totalAlbums, recentPhotosCount] = await Promise.all([
    db.photo.count({ where: PUBLIC_COMPLETED_WHERE }),
    db.tag.count(),
    db.album.count({ where: { visibility: VISIBILITY.PUBLIC } }),
    db.photo.count({
      where: {
        ...PUBLIC_COMPLETED_WHERE,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return {
    totalPhotos,
    totalTags,
    totalAlbums,
    recentPhotosCount,
  }
}

async function fetchTopAlbums(): Promise<LandingAlbumHighlight[]> {
  const albumGroupsRaw = await db.photo.groupBy({
    by: ['albumId'],
    where: {
      ...PUBLIC_COMPLETED_WHERE,
      albumId: {
        not: null,
      },
    },
    _count: {
      _all: true,
    },
  })

  const albumGroups = albumGroupsRaw
    .filter((group) => group.albumId)
    .sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0))
    .slice(0, 3)

  const albumIds = albumGroups
    .map((group) => group.albumId)
    .filter((id): id is string => Boolean(id))

  if (albumIds.length === 0) {
    return []
  }

  const albums = await db.album.findMany({
    where: {
      id: {
        in: albumIds,
      },
    },
    include: {
      coverPhoto: {
        include: {
          variants: true,
          tags: {
            include: {
              tag: true,
            },
          },
          album: true,
        },
      },
    },
  })

  const fallbackPhotos = await db.photo.findMany({
    where: {
      ...PUBLIC_COMPLETED_WHERE,
      albumId: {
        in: albumIds,
      },
    },
    include: {
      variants: true,
      tags: {
        include: {
          tag: true,
        },
      },
      album: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const fallbackByAlbum = new Map<string, PhotoWithDetails>()
  for (const photo of fallbackPhotos) {
    if (!photo.albumId) continue
    if (!fallbackByAlbum.has(photo.albumId)) {
      fallbackByAlbum.set(photo.albumId, photo as unknown as PhotoWithDetails)
    }
  }

  const albumMap = new Map(albums.map((album) => [album.id, album]))

  return albumGroups
    .map((group) => {
      const albumId = group.albumId
      if (!albumId) return null
      const album = albumMap.get(albumId)
      if (!album) return null

      let cover: PhotoWithDetails | null = null
      if (album.coverPhoto) {
        cover = album.coverPhoto as unknown as PhotoWithDetails
      } else {
        cover = fallbackByAlbum.get(albumId) ?? null
      }

      const highlight: LandingAlbumHighlight = {
        id: album.id,
        title: album.title,
        description: album.description ?? null,
        photoCount: group._count?._all ?? 0,
      }

      if (cover) {
        highlight.coverPhoto = cover
      }

      return highlight
    })
    .filter((value): value is LandingAlbumHighlight => value !== null)
}

async function fetchTopTags(): Promise<LandingTagHighlight[]> {
  const tagGroupsRaw = await db.photoTag.groupBy({
    by: ['tagId'],
    where: {
      photo: PUBLIC_COMPLETED_WHERE,
    },
    _count: {
      _all: true,
    },
  })

  const tagGroups = tagGroupsRaw
    .sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0))
    .slice(0, 8)

  const tagIds = tagGroups.map((group) => group.tagId)

  if (tagIds.length === 0) {
    return []
  }

  const tags = await db.tag.findMany({
    where: {
      id: {
        in: tagIds,
      },
    },
  })

  const tagMap = new Map(tags.map((tag) => [tag.id, tag]))

  return tagGroups
    .map((group) => {
      const tag = tagMap.get(group.tagId)
      if (!tag) return null
      return {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        photoCount: group._count?._all ?? 0,
      }
    })
    .filter((value): value is LandingTagHighlight => Boolean(value))
}

async function fetchPipelineSnapshot(): Promise<LandingPipelineSnapshot> {
  const pipelineGroups = await db.photo.groupBy({
    by: ['status'],
    _count: {
      _all: true,
    },
  })

  const totals: Record<PhotoStatus, number> = { ...EMPTY_PIPELINE_TOTALS }

  for (const group of pipelineGroups) {
    const status = group.status as PhotoStatus
    if (status in totals) {
      totals[status] = group._count?._all ?? 0
    }
  }

  return {
    totals,
    totalActive: totals[PHOTO_STATUS.UPLOADING] + totals[PHOTO_STATUS.PROCESSING],
  }
}

async function fetchRecentActivity(): Promise<LandingActivityItem[]> {
  const photos = await db.photo.findMany({
    where: {
      visibility: VISIBILITY.PUBLIC,
      status: {
        in: [
          PHOTO_STATUS.UPLOADING,
          PHOTO_STATUS.PROCESSING,
          PHOTO_STATUS.COMPLETED,
        ],
      },
    },
    include: {
      album: {
        select: {
          id: true,
          title: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
  })

  return photos.map((photo) => ({
    id: photo.id,
    createdAt: photo.createdAt,
    status: photo.status as PhotoStatus,
    album: photo.album
      ? {
          id: photo.album.id,
          title: photo.album.title,
        }
      : null,
    tags: photo.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  }))
}