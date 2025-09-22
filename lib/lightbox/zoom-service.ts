import type { PhotoWithDetails } from '@/types'
import { getImageUrl } from '@/lib/utils'

export interface ZoomSource {
  level: number
  variant: string
  format: string
  url: string
  width: number
  height: number
}

export type DeepZoomCapability = 'high' | 'medium' | 'low'

const VARIANT_PRIORITY: Record<string, number> = {
  thumb: 0,
  small: 1,
  medium: 2,
  large: 3,
  xlarge: 4,
  original: 5,
  zoom: 6,
}

const MIN_DEEP_ZOOM_DIMENSION = 2800

function appendSearchParam(url: string, key: string, value: string): string {
  if (!url.includes('?')) {
    return `${url}?${key}=${value}`
  }
  const separator = url.endsWith('?') || url.endsWith('&') ? '' : '&'
  return `${url}${separator}${key}=${value}`
}

function buildVariantUrl(photoId: string, variant: string, format: string): string {
  const base = getImageUrl(photoId, variant === 'zoom' ? 'original' : variant, format)
  if (variant === 'zoom' || variant === 'original') {
    return appendSearchParam(base, 'variant', 'zoom')
  }
  return base
}

export function getZoomSources(photo: PhotoWithDetails): ZoomSource[] {
  const variants = Array.isArray(photo.variants) ? photo.variants : []
  const collected: ZoomSource[] = []

  for (const variant of variants) {
    if (!variant) continue
    const priority = VARIANT_PRIORITY[variant.variant] ?? 1
    if (priority < VARIANT_PRIORITY.large) continue
    const width = variant.width || photo.width || 0
    const height = variant.height || photo.height || 0
    if (!width || !height) continue
    const format = variant.format || 'webp'
    collected.push({
      level: priority,
      variant: variant.variant,
      format,
      url: buildVariantUrl(photo.id, variant.variant, format),
      width,
      height,
    })
  }

  if (!collected.length) {
    const fallbackWidth = photo.width || 2048
    const fallbackHeight = photo.height || Math.round(fallbackWidth * 0.66)
    collected.push({
      level: VARIANT_PRIORITY.large,
      variant: 'large',
      format: 'webp',
      url: getImageUrl(photo.id, 'large', 'webp'),
      width: fallbackWidth,
      height: fallbackHeight,
    })
    collected.push({
      level: VARIANT_PRIORITY.original,
      variant: 'zoom',
      format: 'jpeg',
      url: buildVariantUrl(photo.id, 'zoom', 'jpeg'),
      width: Math.max(fallbackWidth, photo.width || fallbackWidth),
      height: Math.max(fallbackHeight, photo.height || fallbackHeight),
    })
  }

  const uniqueByVariant = new Map<string, ZoomSource>()
  for (const source of collected) {
    const key = `${source.variant}-${source.format}`
    if (!uniqueByVariant.has(key)) {
      uniqueByVariant.set(key, source)
    }
  }

  return Array.from(uniqueByVariant.values()).sort((a, b) => a.level - b.level)
}

function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const webgl2 = canvas.getContext('webgl2')
    if (webgl2) return true
    const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return Boolean(webgl)
  } catch {
    return false
  }
}

export function detectDeepZoomCapability(): DeepZoomCapability {
  if (typeof window === 'undefined') return 'medium'

  const nav = window.navigator as Navigator & { deviceMemory?: number; gpu?: unknown }
  const deviceMemory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 4
  const concurrency = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4
  const hasWebGL = hasWebGLSupport()
  const hasWebGPU = typeof nav.gpu !== 'undefined'
  const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false

  if (!hasWebGL) return 'low'
  if (prefersReducedMotion && !hasWebGPU) return 'low'

  if ((deviceMemory >= 6 && concurrency >= 6) || hasWebGPU) {
    return 'high'
  }
  if (deviceMemory >= 4 && concurrency >= 4) {
    return 'medium'
  }
  return 'low'
}

export function shouldEnableDeepZoom(photo: PhotoWithDetails): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEEP_ZOOM === 'false') {
    return false
  }

  const capability = detectDeepZoomCapability()
  if (capability === 'low') return false

  const width = photo.width || 0
  const height = photo.height || 0
  const maxDimension = Math.max(width, height)
  if (maxDimension >= MIN_DEEP_ZOOM_DIMENSION) return true

  if (Array.isArray(photo.variants)) {
    return photo.variants.some((variant) => {
      if (!variant) return false
      const level = VARIANT_PRIORITY[variant.variant] ?? 0
      if (level < VARIANT_PRIORITY.large) return false
      return (variant.width || 0) >= MIN_DEEP_ZOOM_DIMENSION
    })
  }

  return false
}

export function isLowCapabilityDevice(): boolean {
  return detectDeepZoomCapability() === 'low'
}
