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
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          CC Frame
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
          个人创意相册
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          用镜头记录生活，让每个瞬间都成为回忆
        </p>
      </div>
    </div>
  )
}

async function SimpleContent() {
  const photos = await getFeaturedPhotos()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHero />
      <div className="container mx-auto px-4 py-16">
        {photos.length === 0 ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              CC Frame 即将精彩呈现
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              照片正在整理中，敬请期待那些珍藏的美好回忆～
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              最新照片 ({photos.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-gray-500">照片</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">加载中...</p>
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