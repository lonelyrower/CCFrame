import type { CatalogFilterPatch } from './catalog'

export type StoryMediaType = 'photo' | 'video' | 'audio' | 'mixed'

export interface StoryEntry {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  photoId?: string | null
  mediaType: StoryMediaType
  mediaSrc?: string | null
  thumbnailUrl?: string | null
  width?: number | null
  height?: number | null
  notes?: string | null
  accentColor?: string | null
  timestamp?: string | null
  durationSeconds?: number | null
}

export interface StorySequence {
  id: string
  title: string
  description?: string | null
  entries: StoryEntry[]
  mode: 'horizontal' | 'vertical'
  audioSrc?: string | null
  tags?: string[]
}

export interface TagStoryCTA {
  label: string
  href: string
  patch?: CatalogFilterPatch
  target?: '_self' | '_blank'
}

export interface TagStoryHighlightPhoto {
  id: string
  src: string
  width?: number | null
  height?: number | null
}

export interface TagStory {
  id: string
  tagId: string
  tagName: string
  accentColor?: string | null
  summary: string
  source?: string | null
  photoCount: number
  highlightPhoto?: TagStoryHighlightPhoto
  relatedTags: string[]
  cta: TagStoryCTA
  updatedAt?: string
}
