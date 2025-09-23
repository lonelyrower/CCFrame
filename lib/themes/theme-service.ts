import { cache } from 'react'

import type { ThemeCollection, ThemeCollectionSummary } from '@/types/themes'
import { prepareThemeCollection } from './chapter-builder'
import { demoThemeCollections } from './demo-data'

const FALLBACK_THEMES = demoThemeCollections.map((theme) => prepareThemeCollection(theme))

export const getThemeCollectionSummaries = cache(async (): Promise<ThemeCollectionSummary[]> => {
  return FALLBACK_THEMES.map(({ slug, title, summary, hero, palette }) => ({
    slug,
    title,
    summary,
    coverImage: hero.background.poster ?? hero.background.src,
    accentColor: palette.primary,
  }))
})

export const getThemeSlugs = cache(async (): Promise<string[]> => {
  const summaries = await getThemeCollectionSummaries()
  return summaries.map((summary) => summary.slug)
})

export const getThemeCollectionBySlug = cache(async (slug: string): Promise<ThemeCollection | null> => {
  const match = FALLBACK_THEMES.find((theme) => theme.slug === slug)
  return match ?? null
})

export const getPrimaryTheme = cache(async (): Promise<ThemeCollection> => {
  return FALLBACK_THEMES[0]
})
