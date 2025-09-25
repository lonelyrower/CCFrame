import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'

import { HomeCurations, HomeHero, HomeLatest, HomeStory } from '@/components/home'
import { FloatingActions } from '@/components/ui'
import { getLandingSnapshot } from '@/lib/landing-data'
import { getImageUrl } from '@/lib/utils'

const landingTitle = 'CC Frame · 光影展厅'
const landingDescription = '这是一场为摄影师而设的小型展览，记录那些诚实的情绪与光影。愿你在缓慢的浏览里，与我共同经历风、树与人群的呼吸。'

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  if (process.env.NODE_ENV === 'production') {
    try {
      const headersList = headers()
      const host = headersList.get('host')
      const proto = headersList.get('x-forwarded-proto') || 'https'
      if (host) {
        return `${proto}://${host}`
      }
    } catch {
      // headers() 在某些执行环境可能不可用
    }
  }

  return 'http://localhost:3000'
}

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
  keywords: ['摄影师', '摄影作品', '影像叙事', '个人展览', 'CC Frame'],
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()

  const snapshot = await getLandingSnapshot()

  const siteUrl = getSiteUrl()
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
    <main className="relative min-h-screen overflow-hidden bg-canvas text-foreground" style={{ background: 'var(--token-color-surface-canvas)' }}>
      <HomeHero photos={snapshot.featuredPhotos} metrics={snapshot.metrics} />
      <HomeCurations photos={snapshot.featuredPhotos} tags={snapshot.topTags} albums={snapshot.topAlbums} />
      <HomeStory statement={landingDescription} albums={snapshot.topAlbums} featuredPhotos={snapshot.featuredPhotos} />
      <HomeLatest photos={snapshot.featuredPhotos} activity={snapshot.recentActivity} />

      {/* Floating Actions */}
      <FloatingActions
        shareUrl={siteUrl}
        shareTitle={landingTitle}
        shareDescription={landingDescription}
      />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  )
}
