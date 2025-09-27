import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'
import Script from 'next/script'

import { HomeCurations, HomeHero, HomeLatest, HomeStory } from '@/components/home'
import { FloatingActions } from '@/components/ui'
import { getLandingSnapshot } from '@/lib/landing-data'
import { CSP_NONCE_HEADER } from '@/lib/security-headers'
import { getImageUrl } from '@/lib/utils'
import ErrorBoundary from '@/components/error-boundary'

const landingTitle = 'CC Frame · 光影展厅'
const landingDescription = '这是一场为摄影师而设的小型展览，记录那些诚实的情绪与光影。愿你在缓慢的浏览里，与我共同经历风、树与人群的呼吸。'

async function getSiteUrl() {
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
  const nonce = headers().get(CSP_NONCE_HEADER) ?? undefined

  try {
    const snapshot = await getLandingSnapshot()

    const siteUrl = await getSiteUrl()
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
      <FloatingActions />

      <Script
        id="landing-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  )
  } catch (error) {
    console.error('HomePage error:', error)
    
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            网站启动失败
          </h1>
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">可能的原因：</h2>
            <ul className="text-left text-gray-600 space-y-2">
              <li>• 数据库未启动或连接失败</li>
              <li>• 环境变量配置错误</li>
              <li>• 依赖包未正确安装</li>
              <li>• Prisma 客户端未生成</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">解决步骤：</h2>
            <ol className="text-left text-blue-700 space-y-2">
              <li>1. 在项目根目录运行 <code className="bg-blue-100 px-2 py-1 rounded text-sm">init-db.bat</code></li>
              <li>2. 或手动执行：
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• <code className="bg-blue-100 px-2 py-1 rounded text-sm">npx prisma generate</code></li>
                  <li>• <code className="bg-blue-100 px-2 py-1 rounded text-sm">npx prisma db push</code></li>
                </ul>
              </li>
              <li>3. 重启开发服务器：<code className="bg-blue-100 px-2 py-1 rounded text-sm">npm run dev</code></li>
            </ol>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-red-50 p-4 rounded-lg mb-6">
              <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                详细错误信息 (开发模式)
              </summary>
              <pre className="text-xs text-red-700 overflow-auto max-h-40 bg-white p-3 rounded border">
                {error instanceof Error ? error.stack : String(error)}
              </pre>
            </details>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              🔄 重新加载页面
            </button>
            <button
              onClick={() => window.location.href = '/admin'}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              进入管理后台
            </button>
          </div>
        </div>
      </main>
    )
  }
}
