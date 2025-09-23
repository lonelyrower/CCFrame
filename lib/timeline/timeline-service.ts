import { cache } from 'react'

import { PHOTO_STATUS, VISIBILITY } from '@/lib/constants'
import { db, isDatabaseConfigured } from '@/lib/db'
import type { PhotoWithDetails } from '@/types'
import {
  type TimelineEvent,
  type TimelineFilterInput,
  type TimelineFilterOptions,
  type TimelineFilterState,
  type TimelineQueryResult,
  type TimelineStats,
  type TimelineTagOption,
  type TimelinePersonaOption,
} from '@/types/timeline'
import { getImageUrl } from '@/lib/utils'
import { demoTimelineEvents } from './demo-data'
import { removeEmptyFilters } from './filters'

const PUBLIC_COMPLETED_PHOTO_WHERE = {
  visibility: VISIBILITY.PUBLIC,
  status: PHOTO_STATUS.COMPLETED,
} as const

const TIMELINE_LIMIT = 360

const getBaseTimelineEvents = cache(async (): Promise<TimelineEvent[]> => {
  if (!isDatabaseConfigured) {
    return demoTimelineEvents
  }

  const photos = await db.photo.findMany({
    where: PUBLIC_COMPLETED_PHOTO_WHERE,
    include: {
      variants: true,
      tags: {
        include: {
          tag: true,
        },
      },
      album: true,
    },
    orderBy: [
      { takenAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: TIMELINE_LIMIT,
  })

  const grouped = new Map<string, PhotoWithDetails[]>()

  for (const photo of photos) {
    const timestamp = (photo.takenAt ?? photo.createdAt).toISOString()
    const dateKey = timestamp.slice(0, 10)
    const bucket = grouped.get(dateKey)
    if (bucket) {
      bucket.push(photo)
    } else {
      grouped.set(dateKey, [photo])
    }
  }

  const events: TimelineEvent[] = Array.from(grouped.entries())
    .sort((a, b) => (a[0] > b[0] ? -1 : 1))
    .map(([dateKey, photoGroup]) => buildEventFromPhotoGroup(dateKey, photoGroup))

  return events
})

function buildEventFromPhotoGroup(dateKey: string, photos: PhotoWithDetails[]): TimelineEvent {
  const sorted = [...photos].sort((a, b) => {
    const aTime = (a.takenAt ?? a.createdAt).getTime()
    const bTime = (b.takenAt ?? b.createdAt).getTime()
    return bTime - aTime
  })

  const primary = sorted[0]
  const timestamp = (primary.takenAt ?? primary.createdAt).toISOString()

  const title = primary.album?.title || primary.title || formatDateLabel(timestamp)
  const subtitle = formatWeekdayLabel(timestamp)
  const description = primary.description || primary.album?.description || `收录 ${photos.length} 张作品`
  const location = extractLocation(primary)

  const personas: TimelineEvent['personas'] = []
  if (primary.album) {
    personas.push({
      id: primary.album.id,
      name: primary.album.title ?? '未命名系列',
      role: '系列',
      accentColor: (primary.tags?.[0]?.tag.color as string | undefined) ?? null,
    })
  }

  const tags = collectEventTags(photos)
  const highlightColor = tags[0]?.color ?? null

  const photosForEvent = sorted.map((photo) => mapPhotoToEventPhoto(photo))
  const primaryPhoto = photosForEvent[0]

  const metrics = collectMetrics(primary)
  const links = buildLinks(primaryPhoto?.id, primary.album?.id)
  const timelineLabel = formatYearSegment(timestamp)

  return {
    id: `timeline-${dateKey}`,
    type: primary.album ? 'story' : 'look',
    timestamp,
    title,
    subtitle,
    description,
    location,
    personas,
    tags,
    photos: photosForEvent,
    primaryPhoto,
    highlightColor,
    metrics,
    links,
    timelineLabel,
  }
}

function mapPhotoToEventPhoto(photo: PhotoWithDetails) {
  const preferredVariant = photo.variants.find((variant) => variant.variant === 'medium') ?? photo.variants[0]
  const src = getImageUrl(photo.id, preferredVariant?.variant ?? 'medium', preferredVariant?.format ?? 'webp')

  return {
    id: photo.id,
    src,
    alt: photo.title ?? photo.album?.title ?? '作品',
    width: preferredVariant?.width ?? null,
    height: preferredVariant?.height ?? null,
    aspectRatio:
      preferredVariant?.width && preferredVariant?.height
        ? `${preferredVariant.width}/${preferredVariant.height}`
        : null,
  }
}

function extractLocation(photo: PhotoWithDetails): string | null {
  const exif = (photo as unknown as { exifJson?: Record<string, any> | null }).exifJson
  if (!exif) return null
  if (typeof exif.location === 'string') return exif.location
  if (exif.location?.address) return exif.location.address
  if (exif.location?.city && exif.location?.country) {
    return `${exif.location.city}, ${exif.location.country}`
  }
  return null
}

function collectEventTags(photos: PhotoWithDetails[]): TimelineEvent['tags'] {
  const tagMap = new Map<string, TimelineEvent['tags'][number]>()
  for (const photo of photos) {
    for (const entry of photo.tags) {
      const tag = entry.tag
      const existing = tagMap.get(tag.id)
      if (!existing) {
        tagMap.set(tag.id, {
          id: tag.id,
          name: tag.name,
          color: (tag.color as string | undefined) ?? null,
        })
      }
    }
  }
  return Array.from(tagMap.values())
}

function collectMetrics(photo: PhotoWithDetails) {
  const exif = (photo as unknown as { exifJson?: Record<string, any> | null }).exifJson
  if (!exif) return undefined

  const metrics = [] as { label: string; value: string }[]
  if (exif.camera) metrics.push({ label: '相机', value: exif.camera })
  if (exif.lens) metrics.push({ label: '镜头', value: exif.lens })
  if (exif.shutterSpeed) metrics.push({ label: '快门', value: exif.shutterSpeed })
  if (exif.aperture) metrics.push({ label: '光圈', value: `f/${exif.aperture}` })
  if (exif.iso) metrics.push({ label: 'ISO', value: String(exif.iso) })

  return metrics.length ? metrics : undefined
}

function buildLinks(primaryPhotoId?: string, albumId?: string | null) {
  const links: TimelineEvent['links'] = []
  if (primaryPhotoId) {
    links.push({ label: '打开光箱', href: `/lightbox?photo=${primaryPhotoId}`, kind: 'lightbox' })
  }
  if (albumId) {
    links.push({ label: '查看系列', href: `/photos?album=${albumId}`, kind: 'theme' })
  }
  return links.length ? links : undefined
}

function formatDateLabel(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatWeekdayLabel(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('zh-CN', { weekday: 'long' })
}

function formatYearSegment(timestamp: string) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.toLocaleDateString('zh-CN', { month: 'short' })
  return `${year} · ${month}`
}

function applyFilters(events: TimelineEvent[], filters: TimelineFilterState): TimelineEvent[] {
  return events.filter((event) => {
    const year = new Date(event.timestamp).getFullYear()
    if (filters.startYear && year < filters.startYear) return false
    if (filters.endYear && year > filters.endYear) return false

    if (filters.personas.length > 0) {
      const matchPersona = event.personas.some((persona) => filters.personas.includes(persona.id))
      if (!matchPersona) return false
    }

    if (filters.tags.length > 0) {
      const matchTag = event.tags.some((tag) => filters.tags.includes(tag.id))
      if (!matchTag) return false
    }

    return true
  })
}

function buildFilterOptions(events: TimelineEvent[]): TimelineFilterOptions {
  const yearSet = new Set<number>()
  const personaMap = new Map<string, TimelinePersonaOption>()
  const tagMap = new Map<string, TimelineTagOption>()

  for (const event of events) {
    yearSet.add(new Date(event.timestamp).getFullYear())

    for (const persona of event.personas) {
      const personaOption = personaMap.get(persona.id)
      if (personaOption) {
        personaOption.count += 1
      } else {
        personaMap.set(persona.id, {
          ...persona,
          count: 1,
        })
      }
    }

    for (const tag of event.tags) {
      const tagOption = tagMap.get(tag.id)
      if (tagOption) {
        tagOption.count += 1
      } else {
        tagMap.set(tag.id, {
          ...tag,
          count: 1,
        })
      }
    }
  }

  const years = Array.from(yearSet).sort((a, b) => a - b)
  const personas = Array.from(personaMap.values()).sort((a, b) => b.count - a.count)
  const tags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count)

  return { years, personas, tags }
}

function buildStats(events: TimelineEvent[]): TimelineStats {
  const personaSet = new Set<string>()
  const tagSet = new Set<string>()
  let photoCount = 0

  for (const event of events) {
    photoCount += event.photos.length
    event.personas.forEach((persona) => personaSet.add(persona.id))
    event.tags.forEach((tag) => tagSet.add(tag.id))
  }

  return {
    totalEvents: events.length,
    totalPhotos: photoCount,
    distinctPersonas: personaSet.size,
    distinctTags: tagSet.size,
  }
}

function normalizeFilters(filters: TimelineFilterInput | undefined): TimelineFilterState {
  return {
    startYear: filters?.startYear,
    endYear: filters?.endYear,
    personas: filters?.personas ? [...filters.personas] : [],
    tags: filters?.tags ? [...filters.tags] : [],
  }
}

export async function getTimelineQuery(filtersInput: TimelineFilterInput = {}): Promise<TimelineQueryResult> {
  const baseEvents = await getBaseTimelineEvents()
  const normalizedFilters = normalizeFilters(filtersInput)
  const filteredEvents = applyFilters(baseEvents, normalizedFilters)

  const options = buildFilterOptions(baseEvents)
  const stats = buildStats(filteredEvents)
  const availableYears = {
    min: options.years[0] ?? null,
    max: options.years[options.years.length - 1] ?? null,
  }

  return {
    events: filteredEvents,
    stats,
    filters: {
      active: normalizeFilters(removeEmptyFilters(normalizedFilters)),
      options,
      availableYears,
    },
  }
}

export async function getTimelineYears(): Promise<{ min: number | null; max: number | null }> {
  const baseEvents = await getBaseTimelineEvents()
  const years = buildFilterOptions(baseEvents).years
  return {
    min: years[0] ?? null,
    max: years[years.length - 1] ?? null,
  }
}

