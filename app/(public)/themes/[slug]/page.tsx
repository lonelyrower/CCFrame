import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ThemeChapterSection } from '@/components/themes/theme-chapter'
import { ThemeHero } from '@/components/themes/theme-hero'
import { featureFlags } from '@/lib/config/feature-flags'
import { getThemeCollectionBySlug, getThemeSlugs } from '@/lib/themes/theme-service'

interface ThemePageProps {
  params: {
    slug: string
  }
}

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getThemeSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const theme = await getThemeCollectionBySlug(params.slug)
  if (!theme) {
    return { title: 'Theme not found' }
  }

  const description = theme.seo?.description ?? theme.summary
  const shareImage = theme.seo?.shareImage ?? theme.hero.background.poster ?? theme.hero.background.src

  return {
    title: `${theme.title} · CC Frame Themes`,
    description,
    openGraph: {
      title: theme.title,
      description,
      images: shareImage ? [{ url: shareImage }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: theme.title,
      description,
      images: shareImage ? [shareImage] : undefined,
    },
  }
}

export default async function ThemePage({ params }: ThemePageProps) {
  if (!featureFlags.enableThemeExperience) {
    notFound()
  }

  const theme = await getThemeCollectionBySlug(params.slug)
  if (!theme) {
    notFound()
  }

  return (
    <div className="space-y-16">
      <ThemeHero theme={theme} />
      <div className="space-y-12">
        {theme.chapters.map((chapter, index) => (
          <ThemeChapterSection key={chapter.id} chapter={chapter} index={index} />
        ))}
      </div>
    </div>
  )
}
