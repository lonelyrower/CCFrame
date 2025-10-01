import type { Photo, PhotoVariant, Tag } from '@prisma/client'

export interface SerializedPhotoMinimal {
  id: string
  width: number
  height: number
  blurhash: string | null
  variants?: Array<{ variant: string; format: string; width: number; height: number }>
}

export interface SerializedPhotoFull extends SerializedPhotoMinimal {
  takenAt?: string | null
  location?: any
  exif?: any
  tags?: Array<{ id: string; name: string; color: string }>
  albumId?: string | null
  visibility: string
  createdAt: string
}

type PhotoWithRelations = Photo & {
  variants?: PhotoVariant[]
  tags?: Array<{ tag: Tag }>
  location?: unknown
  exifJson?: unknown
}

function parseJsonValue<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  if (typeof value === 'object') {
    return value as T
  }
  return null
}

function cloneJson<T>(value: T | null): T | null {
  if (value === null || value === undefined) return null
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

function toISOStringOrNull(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function serializePhoto(
  photo: PhotoWithRelations,
  opts: { mode?: 'minimal' | 'full'; includeVariants?: boolean; stripLocation?: boolean } = {}
): SerializedPhotoMinimal | SerializedPhotoFull {
  const mode = opts.mode || 'minimal'
  const base: SerializedPhotoMinimal = {
    id: photo.id,
    width: photo.width ?? 0,
    height: photo.height ?? 0,
    blurhash: photo.blurhash || null,
  }

  if (opts.includeVariants && photo.variants) {
    base.variants = photo.variants.map((v) => ({
      variant: v.variant,
      format: v.format,
      width: v.width ?? 0,
      height: v.height ?? 0,
    }))
  }

  if (mode === 'minimal') return base

  const parsedExif = parseJsonValue<Record<string, unknown>>(photo.exifJson)
  const exif = cloneJson(parsedExif)
  if (opts.stripLocation && exif && typeof exif === 'object' && 'location' in exif) {
    delete (exif as Record<string, unknown>).location
  }

  const rawLocation = opts.stripLocation
    ? null
    : photo.location ?? (parsedExif && typeof parsedExif === 'object' ? (parsedExif as any).location : null)
  const location = opts.stripLocation ? null : cloneJson(rawLocation)

  return {
    ...base,
    takenAt: toISOStringOrNull(photo.takenAt ?? null),
    location,
    exif,
    tags: photo.tags ? photo.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, color: tag.color })) : [],
    albumId: photo.albumId || null,
    visibility: photo.visibility,
    createdAt: toISOStringOrNull(photo.createdAt) || new Date().toISOString(),
  }
}

export function serializePhotos(list: PhotoWithRelations[], opts: Parameters<typeof serializePhoto>[1]) {
  return list.map((p) => serializePhoto(p, opts))
}

