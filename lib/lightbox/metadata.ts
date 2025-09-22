import type { PhotoWithDetails } from '@/types'

export interface PhotoMetadataField {
  label: string
  value: string
}

export interface PhotoMetadata {
  headline: string
  summary?: string | null
  dimensions: string
  exif: PhotoMetadataField[]
  location?: string | null
}

function formatNumber(value: number | null | undefined, digits: number = 1): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return value.toFixed(digits)
}

export function buildPhotoMetadata(photo: PhotoWithDetails): PhotoMetadata {
  const dimensions = photo.width && photo.height ? `${photo.width} × ${photo.height}` : '未知尺寸'

  const exif: PhotoMetadataField[] = []
  const exifJson = photo.exifJson as Record<string, unknown> | null | undefined

  if (exifJson) {
    if (typeof exifJson.camera === 'string') {
      exif.push({ label: '相机', value: String(exifJson.camera) })
    }
    if (typeof exifJson.lens === 'string') {
      exif.push({ label: '镜头', value: String(exifJson.lens) })
    }
    if (exifJson.focalLength != null) {
      const formatted = formatNumber(Number(exifJson.focalLength), 0)
      if (formatted) exif.push({ label: '焦距', value: `${formatted}mm` })
    }
    if (exifJson.aperture != null) {
      const formatted = formatNumber(Number(exifJson.aperture), 1)
      if (formatted) exif.push({ label: '光圈', value: `f/${formatted}` })
    }
    if (exifJson.shutterSpeed) {
      exif.push({ label: '快门', value: String(exifJson.shutterSpeed) })
    }
    if (exifJson.iso != null) {
      exif.push({ label: 'ISO', value: String(exifJson.iso) })
    }
  }

  const location = (() => {
    const loc = photo.location as Record<string, unknown> | null | undefined
    if (!loc) return null
    if (typeof loc.address === 'string' && loc.address.length > 0) {
      return loc.address
    }
    const lat = typeof loc.lat === 'number' ? loc.lat : null
    const lng = typeof loc.lng === 'number' ? loc.lng : null
    if (lat != null && lng != null) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
    return null
  })()

  return {
    headline: photo.album?.title ?? photo.title ?? '未命名作品',
    summary: photo.album?.description ?? photo.description ?? null,
    dimensions,
    exif,
    location,
  }
}
