import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface AdvancedPhotoFilters {
  // Date range
  dateRange?: { start: Date; end: Date }
  
  // File properties
  fileSize?: { min: number; max: number } // bytes
  dimensions?: { minWidth: number; minHeight: number }
  
  // EXIF data
  camera?: string
  lens?: string
  iso?: { min: number; max: number }
  aperture?: { min: number; max: number }
  focalLength?: { min: number; max: number }
  
  // Location
  hasLocation?: boolean
  
  // Albums and tags
  albumId?: string
  tagNames?: string[]
  
  // Search
  search?: string
}

/**
 * Build Prisma where clause from advanced filters
 */
export function buildPhotoWhereClause(filters: AdvancedPhotoFilters): Prisma.PhotoWhereInput {
  const where: Prisma.PhotoWhereInput = {}
  const andConditions: Prisma.PhotoWhereInput[] = []

  // Date range filter
  if (filters.dateRange) {
    where.takenAt = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end
    }
  }

  // Dimensions filter
  if (filters.dimensions) {
    if (filters.dimensions.minWidth > 0) {
      andConditions.push({ width: { gte: filters.dimensions.minWidth } })
    }
    if (filters.dimensions.minHeight > 0) {
      andConditions.push({ height: { gte: filters.dimensions.minHeight } })
    }
  }

  // Camera filter (searches in exifJson)
  if (filters.camera) {
    andConditions.push({
      exifJson: {
        path: ['Make'],
        string_contains: filters.camera
      }
    })
  }

  // Location filter
  if (filters.hasLocation !== undefined) {
    if (filters.hasLocation) {
      andConditions.push({
        location: {
          not: Prisma.DbNull
        }
      })
    } else {
      where.location = {
        equals: Prisma.DbNull
      }
    }
  }

  // Album filter
  if (filters.albumId) {
    where.albumId = filters.albumId
  }

  // Tags filter
  if (filters.tagNames && filters.tagNames.length > 0) {
    where.tags = {
      some: {
        tag: {
          name: {
            in: filters.tagNames
          }
        }
      }
    }
  }

  // Search filter (searches in hash or file key)
  if (filters.search) {
    where.OR = [
      { hash: { contains: filters.search, mode: 'insensitive' } },
      { fileKey: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  // Combine AND conditions
  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  return where
}

/**
 * Get filtered photos with pagination
 */
export async function getFilteredPhotos(
  filters: AdvancedPhotoFilters,
  options: {
    limit?: number
    cursor?: string
    orderBy?: Prisma.PhotoOrderByWithRelationInput
  } = {}
) {
  const { limit = 50, cursor, orderBy = { takenAt: 'desc' } } = options

  const where = buildPhotoWhereClause(filters)

  const photos = await db.photo.findMany({
    where,
    take: limit + 1, // Take one extra to check if there's more
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy,
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      variants: true,
      album: true
    }
  })

  const hasMore = photos.length > limit
  const results = hasMore ? photos.slice(0, limit) : photos
  const nextCursor = hasMore ? results[results.length - 1].id : null

  return {
    photos: results,
    nextCursor,
    hasMore
  }
}

/**
 * Get count of photos matching filters
 */
export async function getFilteredPhotosCount(filters: AdvancedPhotoFilters) {
  const where = buildPhotoWhereClause(filters)
  return db.photo.count({ where })
}

/**
 * Get unique camera models for autocomplete
 */
export async function getCameraSuggestions() {
  const photos = await db.photo.findMany({
    where: {
      exifJson: {
        not: Prisma.DbNull
      }
    },
    select: {
      exifJson: true
    },
    take: 1000
  })

  const cameras = new Map<string, number>()
  
  for (const photo of photos) {
    const exif = photo.exifJson as any
    const make = exif?.Make
    if (make && typeof make === 'string') {
      cameras.set(make, (cameras.get(make) || 0) + 1)
    }
  }

  return Array.from(cameras.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

