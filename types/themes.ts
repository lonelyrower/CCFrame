export type ThemeChapterVariant = 'spotlight' | 'gallery' | 'quote' | 'timeline-snapshot'

export type ThemeMediaType = 'image' | 'video' | 'audio'

export interface ThemeMediaAsset {
  id: string
  type: ThemeMediaType
  src: string
  alt?: string | null
  width?: number | null
  height?: number | null
  poster?: string | null
  aspectRatio?: string | null
  loop?: boolean
  autoplay?: boolean
}

export interface ThemeChapterMetric {
  label: string
  value: string
}

export interface ThemeActionLink {
  label: string
  href: string
  target?: '_self' | '_blank'
  accentColor?: string | null
}

export interface ThemeQuoteBlock {
  text: string
  author?: string | null
  role?: string | null
}

export interface ThemeTimelineSnippet {
  year: string
  description: string
  href?: string | null
}

export interface ThemeChapter {
  id: string
  title: string
  subtitle?: string | null
  kicker?: string | null
  variant: ThemeChapterVariant
  body?: string[]
  media: ThemeMediaAsset[]
  metrics?: ThemeChapterMetric[]
  quote?: ThemeQuoteBlock | null
  timeline?: ThemeTimelineSnippet | null
  accentColor?: string | null
  surfaceTone?: 'dark' | 'light' | null
  backgroundImage?: string | null
  actions?: ThemeActionLink[]
}

export interface ThemeSoundtrack {
  title: string
  artist?: string | null
  src: string
  durationSeconds?: number | null
  coverImage?: string | null
}

export interface ThemeHeroBackground {
  type: 'image' | 'video'
  src: string
  alt?: string | null
  poster?: string | null
  overlayColor?: string | null
}

export interface ThemeHero {
  kicker?: string | null
  title: string
  subtitle?: string | null
  description?: string | null
  background: ThemeHeroBackground
  metrics?: ThemeChapterMetric[]
  actions?: ThemeActionLink[]
}

export interface ThemeCollectionSummary {
  slug: string
  title: string
  summary: string
  coverImage: string
  accentColor?: string | null
}

export interface ThemeCollection {
  id: string
  slug: string
  title: string
  summary: string
  tags: string[]
  palette: {
    primary: string
    secondary: string
    background: string
    highlight: string
  }
  hero: ThemeHero
  soundtrack?: ThemeSoundtrack
  chapters: ThemeChapter[]
  relatedCollections?: ThemeCollectionSummary[]
  seo?: {
    description?: string | null
    keywords?: string[] | null
    shareImage?: string | null
  }
  createdAt?: string | null
  updatedAt?: string | null
}
