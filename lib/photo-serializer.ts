import type { Photo, PhotoVariant, PhotoTag, Tag } from '@prisma/client'

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

export function serializePhoto(
  photo: any,
  opts: { mode?: 'minimal' | 'full'; includeVariants?: boolean; stripLocation?: boolean } = {}
): SerializedPhotoMinimal | SerializedPhotoFull {
  const mode = opts.mode || 'minimal'
  const base: SerializedPhotoMinimal = {
    id: photo.id,
    width: photo.width,
    height: photo.height,
    blurhash: photo.blurhash || null,
  }
  if (opts.includeVariants && photo.variants) {
    base.variants = photo.variants.map((v: any) => ({ variant: v.variant, format: v.format, width: v.width, height: v.height }))
  }
  if (mode === 'minimal') return base
  let exif: any = null
  if (photo.exifJson) {
    try { exif = JSON.parse(photo.exifJson) } catch {}
  }
  if (opts.stripLocation && exif?.location) delete exif.location
  return {
    ...base,
    takenAt: photo.takenAt ? new Date(photo.takenAt).toISOString() : null,
    location: !opts.stripLocation ? (exif?.location || null) : null,
    exif,
    tags: photo.tags ? photo.tags.map((t: any) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) : [],
    albumId: photo.albumId || null,
    visibility: photo.visibility,
    createdAt: photo.createdAt ? new Date(photo.createdAt).toISOString() : new Date().toISOString(),
  }
}

export function serializePhotos(list: any[], opts: Parameters<typeof serializePhoto>[1]) {
  return list.map(p => serializePhoto(p, opts))
}
