import type { ThemeCollection } from '@/types/themes'

const FALLBACK_TONE = 'dark' as const

export function prepareThemeCollection(source: ThemeCollection): ThemeCollection {
  return {
    ...source,
    tags: [...source.tags],
    hero: {
      ...source.hero,
      metrics: source.hero.metrics?.map((metric) => ({ ...metric })),
      actions: source.hero.actions?.map((action) => ({ ...action })),
      background: { ...source.hero.background },
    },
    soundtrack: source.soundtrack ? { ...source.soundtrack } : undefined,
    chapters: source.chapters.map((chapter, index) => ({
      ...chapter,
      accentColor: chapter.accentColor ?? source.palette.highlight,
      surfaceTone: chapter.surfaceTone ?? FALLBACK_TONE,
      kicker: chapter.kicker ?? `Chapter ${String(index + 1).padStart(2, '0')}`,
      media: chapter.media.map((asset) => ({ ...asset })),
      metrics: chapter.metrics?.map((metric) => ({ ...metric })),
      actions: chapter.actions?.map((action) => ({ ...action })),
      quote: chapter.quote ? { ...chapter.quote } : undefined,
      timeline: chapter.timeline ? { ...chapter.timeline } : undefined,
    })),
    relatedCollections: source.relatedCollections?.map((item) => ({ ...item })),
    seo: source.seo ? { ...source.seo, keywords: source.seo.keywords ? [...source.seo.keywords] : undefined } : undefined,
  }
}
