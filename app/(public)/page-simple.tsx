import { Suspense } from 'react'
import { db } from '@/lib/db'

async function getFeaturedPhotos() {
  try {
    const photos = await db.photo.findMany({
      where: {
        visibility: 'PUBLIC',
        status: 'COMPLETED'
      },
      take: 12,
      orderBy: {
        createdAt: 'desc'
      }
    })
    return photos
  } catch (error) {
    console.error('Database error:', error)
    return []
  }
}

function SimpleHero() {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/15 dark:from-surface-canvas/90 dark:to-surface-panel/80 py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6 text-text-primary dark:text-text-inverted">
          CC Frame
        </h1>
        <p className="text-xl text-text-secondary dark:text-text-muted mb-4">
          个人创意相册
        </p>
        <p className="text-text-muted dark:text-text-muted">
          用镜头记录生活，让每个瞬间都成为回忆
        </p>
      </div>
    </div>
  )
}

async function SimpleContent() {
  const photos = await getFeaturedPhotos()
  
  return (
    <div className="min-h-screen bg-surface-canvas dark:bg-surface-canvas">
      <SimpleHero />
      <div className="container mx-auto px-4 py-16">
        {photos.length === 0 ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-text-primary dark:text-text-inverted">
              CC Frame 即将精彩呈现
            </h2>
            <p className="text-text-secondary dark:text-text-muted">
              照片正在整理中，敬请期待那些珍藏的美好回忆～
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-text-inverted">
              最新照片 ({photos.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-surface-panel dark:bg-surface-panel rounded-lg p-4 shadow-subtle">
                  <div className="aspect-square bg-surface-panel dark:bg-surface-panel rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-text-muted">照片</span>
                  </div>
                  <p className="text-sm text-text-secondary dark:text-text-muted">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SimpleLoading() {
  return (
    <div className="min-h-screen bg-surface-canvas dark:bg-surface-canvas flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary dark:text-text-muted">加载中...</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<SimpleLoading />}>
      <SimpleContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'