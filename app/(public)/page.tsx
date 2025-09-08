import { Suspense } from 'react'
import { db } from '@/lib/db'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { PhotoWithDetails } from '@/types'
import { Camera, Calendar, Tag, TrendingUp, MapPin, Heart, Aperture, Sparkles, Zap } from 'lucide-react'

async function getFeaturedPhotos(): Promise<PhotoWithDetails[]> {
  const photos = await db.photo.findMany({
    where: {
      visibility: 'PUBLIC',
      status: 'COMPLETED'
    },
    include: {
      variants: true,
      tags: {
        include: {
          tag: true
        }
      },
      album: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  return photos
}

async function getPhotoStats() {
  const [totalPhotos, totalTags, totalAlbums, recentPhotosCount] = await Promise.all([
    db.photo.count({ where: { visibility: 'PUBLIC', status: 'COMPLETED' } }),
    db.tag.count(),
    db.album.count(),
    db.photo.count({
      where: {
        visibility: 'PUBLIC',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      }
    })
  ])

  return {
    totalPhotos,
    totalTags,
    totalAlbums,
    recentPhotosCount
  }
}

function StatsCard({ icon: Icon, label, value, trend }: { icon: any, label: string, value: string, trend?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      {trend && (
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">{trend}</div>
      )}
    </div>
  )
}

function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950">
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      <div className="container mx-auto px-4 py-16 relative">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-200/20 dark:border-purple-500/20 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-full text-sm font-medium mb-8">
            <div className="relative">
              <Aperture className="w-5 h-5" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-purple-500" />
            </div>
            CC Frame - 个人创意相册
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Creative Camera
            </span>
            <br />
            <span className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Frame
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6 font-light leading-relaxed">
            用镜头记录生活，让每个瞬间都成为
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">回忆</span>
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            欢迎来到我的个人相册，这里收藏着生活中的点点滴滴。
            每一张照片都承载着一个故事，每一个瞬间都值得被珍藏。
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              <span>精美展示</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              <span>智能分类</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" />
              <span>时间轴浏览</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GalleryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-12 mb-2" />
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-1" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
      <MasonryGallery photos={[]} loading />
    </div>
  )
}

async function GalleryContent() {
  const [photos, stats] = await Promise.all([
    getFeaturedPhotos(),
    getPhotoStats()
  ])

  if (photos.length === 0) {
    return (
      <div>
        <HeroSection />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-sm opacity-20" />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl shadow-lg">
                  <Aperture className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">CC Frame 即将精彩呈现</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              照片正在整理中，敬请期待那些珍藏的美好回忆～
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <HeroSection />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatsCard 
            icon={Camera}
            label="总照片数"
            value={stats.totalPhotos.toString()}
          />
          <StatsCard 
            icon={Tag}
            label="标签数量"
            value={stats.totalTags.toString()}
          />
          <StatsCard 
            icon={Heart}
            label="相册数量"
            value={stats.totalAlbums.toString()}
          />
          <StatsCard 
            icon={TrendingUp}
            label="本月新增"
            value={stats.recentPhotosCount.toString()}
            trend={stats.recentPhotosCount > 0 ? `+${stats.recentPhotosCount} 张新照片` : undefined}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">最新照片</h2>
          <p className="text-gray-600 dark:text-gray-400">发现生活中的美好时刻</p>
        </div>
        
        <MasonryGallery photos={photos} />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<GalleryLoading />}>
      <GalleryContent />
    </Suspense>
  )
}

// 避免在构建阶段访问数据库，强制运行时渲染
export const dynamic = 'force-dynamic'
