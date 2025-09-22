import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'

import {
  LandingHero,
  LandingShowcase,
  LandingMetrics,
  LandingFeatureRail,
  LandingCollections,
  LandingMoodboard,
  LandingPipeline,
  LandingTimeline,
  LandingCTA,
} from '@/components/landing'
import { getLandingSnapshot } from '@/lib/landing-data'
import { getSemanticConfig } from '@/lib/semantic-config'
import { getImageUrl } from '@/lib/utils'

const landingTitle = 'CC Frame · 创意摄影内容中台'
const landingDescription = '以专业级的自动化处理、语义检索与叙事工具，帮助摄影团队构建高效的作品管理与交付体验。'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const ogImage = '/icons/icon-512.png'

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: landingTitle,
    description: landingDescription,
    images: [
      {
        url: ogImage,
        width: 512,
        height: 512,
        alt: 'CC Frame 标识',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: landingTitle,
    description: landingDescription,
    images: [ogImage],
  },
  keywords: ['摄影作品集', '语义搜索', '数字影像', '自动化管线', 'CC Frame'],
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()

  const [snapshot, semanticConfig] = await Promise.all([
    getLandingSnapshot(),
    Promise.resolve(getSemanticConfig()),
  ])

  const toAbsolute = (path: string) => (path.startsWith('http') ? path : `${siteUrl}${path}`)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: landingTitle,
    description: landingDescription,
    url: siteUrl,
    inLanguage: 'zh-CN',
    image: toAbsolute(ogImage),
    about: snapshot.topTags.slice(0, 6).map((tag) => ({
      '@type': 'DefinedTerm',
      name: tag.name,
      description: `收录 ${tag.photoCount} 张作品`,
    })),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: snapshot.featuredPhotos.slice(0, 6).map((photo, index) => ({
        '@type': 'ImageObject',
        position: index + 1,
        name: photo.album?.title || `精选作品 ${index + 1}`,
        url: `${siteUrl}/photos`,
        contentUrl: toAbsolute(getImageUrl(photo.id, 'medium', 'webp')),
        dateCreated: photo.createdAt instanceof Date ? photo.createdAt.toISOString() : undefined,
      })),
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/photos?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <LandingHero photos={snapshot.featuredPhotos} metrics={snapshot.metrics} />
      <LandingShowcase photos={snapshot.featuredPhotos} />
      <LandingMetrics
        metrics={snapshot.metrics}
        semantic={{ enabled: semanticConfig.enabled, mode: semanticConfig.mode }}
      />
      <LandingFeatureRail />
      <LandingCollections albums={snapshot.topAlbums} />
      <LandingMoodboard tags={snapshot.topTags} />
      <LandingPipeline pipeline={snapshot.pipeline} />
      <LandingTimeline activity={snapshot.recentActivity} />
      <LandingCTA metrics={snapshot.metrics} />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  )
}
