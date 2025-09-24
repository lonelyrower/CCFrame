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

const landingTitle = 'CC Frame · 我的摄影时光'
const landingDescription = '记录生活中的美好瞬间，分享摄影路上的点点滴滴。一个简洁优雅的个人相册，让每一张照片都有它的故事。'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://2.135.147.52'
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
  keywords: ['个人相册', '摄影作品', '生活记录', '美好时光', 'CC Frame'],
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
