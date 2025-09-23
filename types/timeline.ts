export type TimelineEventType = 'look' | 'story' | 'milestone' | 'exhibition' | 'collaboration'

export interface TimelineEventPhoto {
  id: string
  src: string
  alt?: string | null
  width?: number | null
  height?: number | null
  aspectRatio?: string | null
  placeholder?: string | null
  tone?: string | null
}

export interface TimelinePersona {
  id: string
  name: string
  role?: string | null
  avatarUrl?: string | null
  accentColor?: string | null
  slug?: string | null
}

export interface TimelineTag {
  id: string
  name: string
  color?: string | null
  slug?: string | null
}

export interface TimelineLink {
  label: string
  href: string
  target?: '_self' | '_blank'
  kind?: 'lightbox' | 'lookbook' | 'theme' | 'external'
}

export interface TimelineMetric {
  label: string
  value: string
}

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  timestamp: string
  title: string
  subtitle?: string | null
  description?: string | null
  location?: string | null
  personas: TimelinePersona[]
  tags: TimelineTag[]
  photos: TimelineEventPhoto[]
  primaryPhoto?: TimelineEventPhoto | null
  highlightColor?: string | null
  metrics?: TimelineMetric[]
  links?: TimelineLink[]
  timelineLabel?: string | null
}

export interface TimelineFilterState {
  startYear?: number
  endYear?: number
  personas: string[]
  tags: string[]
}

export interface TimelinePersonaOption extends TimelinePersona {
  count: number
}

export interface TimelineTagOption extends TimelineTag {
  count: number
}

export interface TimelineFilterOptions {
  years: number[]
  personas: TimelinePersonaOption[]
  tags: TimelineTagOption[]
}

export interface TimelineStats {
  totalEvents: number
  totalPhotos: number
  distinctPersonas: number
  distinctTags: number
}

export interface TimelineQueryResult {
  events: TimelineEvent[]
  stats: TimelineStats
  filters: {
    active: TimelineFilterState
    options: TimelineFilterOptions
    availableYears: {
      min: number | null
      max: number | null
    }
  }
}

export type TimelineFilterInput = Partial<TimelineFilterState>
