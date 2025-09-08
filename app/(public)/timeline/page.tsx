import { Suspense } from 'react'
import { db } from '@/lib/db'
import { PhotoWithDetails } from '@/types'
import { Calendar, Clock, MapPin, Camera } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'

interface TimelineGroup {
  date: string
  displayDate: string
  photos: PhotoWithDetails[]
}

async function getTimelinePhotos(): Promise<TimelineGroup[]> {
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
      takenAt: 'desc'
    },
    take: 200
  })

  // 按日期分组
  const groupedPhotos = photos.reduce((groups, photo) => {
    const date = photo.takenAt || photo.createdAt
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(photo)
    return groups
  }, {} as Record<string, PhotoWithDetails[]>)

  // 转换为时间线格式并排序
  const timelineGroups: TimelineGroup[] = Object.entries(groupedPhotos)
    .map(([date, photos]) => ({
      date,
      displayDate: formatDisplayDate(new Date(date)),
      photos
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return timelineGroups
}

function formatDisplayDate(date: Date): string {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (year === now.getFullYear()) {
    return `${month}月${day}日`
  }
  
  return `${year}年${month}月${day}日`
}

function TimelineItem({ group, index }: { group: TimelineGroup; index: number }) {
  const mainPhoto = group.photos[0]
  const additionalPhotos = group.photos.slice(1)
  
  return (
    <div className="relative">
      {/* 时间线左侧的线条 */}
      <div className="absolute left-6 top-12 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent" />
      
      {/* 时间点 */}
      <div className="absolute left-4 top-4 w-4 h-4 bg-primary rounded-full border-4 border-white dark:border-gray-900 shadow-sm" />
      
      {/* 内容卡片 */}
      <div className="ml-16 mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
          {/* 日期头部 */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {group.displayDate}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {group.photos.length} 张照片
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(group.date).toLocaleDateString('zh-CN', {
                  weekday: 'long'
                })}
              </div>
            </div>
          </div>
          
          {/* 照片网格 */}
          <div className="p-6">
            {group.photos.length === 1 ? (
              // 单张照片 - 大图显示
              <div className="max-w-md mx-auto">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={getImageUrl(mainPhoto.id, 'medium', 'webp')}
                    alt={mainPhoto.album?.title || 'Photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    onError={(e) => {
                      console.error('Timeline single image failed to load:', mainPhoto.id)
                      const img = e.target as HTMLImageElement
                      if (img.src.includes('webp')) {
                        img.src = getImageUrl(mainPhoto.id, 'medium', 'jpeg')
                      } else if (img.src.includes('medium')) {
                        img.src = getImageUrl(mainPhoto.id, 'small', 'webp')
                      } else if (img.src.includes('small')) {
                        img.src = `/api/image/${mainPhoto.id}/medium?format=jpeg`
                      }
                    }}
                  />
                </div>
                {mainPhoto.album?.title && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                    {mainPhoto.album.title}
                  </p>
                )}
              </div>
            ) : group.photos.length <= 4 ? (
              // 2-4张照片 - 网格布局
              <div className={`grid gap-3 ${
                group.photos.length === 2 ? 'grid-cols-2' :
                group.photos.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
              }`}>
                {group.photos.map((photo, idx) => (
                  <div key={photo.id} className={`
                    relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700
                    ${group.photos.length === 4 && idx >= 2 ? 'col-span-1' : ''}
                  `}>
                    <Image
                      src={getImageUrl(photo.id, 'small', 'webp')}
                      alt={photo.album?.title || 'Photo'}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-200"
                      sizes="200px"
                      onError={(e) => {
                        console.error('Timeline grid image failed to load:', photo.id)
                        const img = e.target as HTMLImageElement
                        if (img.src.includes('webp')) {
                          img.src = getImageUrl(photo.id, 'small', 'jpeg')
                        } else if (img.src.includes('small')) {
                          img.src = getImageUrl(photo.id, 'thumb', 'webp')
                        } else if (img.src.includes('thumb')) {
                          img.src = `/api/image/${photo.id}/small?format=jpeg`
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // 5张以上照片 - 主图 + 缩略图
              <div className="space-y-4">
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={getImageUrl(mainPhoto.id, 'medium', 'webp')}
                    alt={mainPhoto.album?.title || 'Photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                    onError={(e) => {
                      console.error('Timeline main image failed to load:', mainPhoto.id)
                      const img = e.target as HTMLImageElement
                      if (img.src.includes('webp')) {
                        img.src = getImageUrl(mainPhoto.id, 'medium', 'jpeg')
                      } else if (img.src.includes('medium')) {
                        img.src = getImageUrl(mainPhoto.id, 'small', 'webp')
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {additionalPhotos.slice(0, 5).map((photo, idx) => (
                    <div key={photo.id} className="relative aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={getImageUrl(photo.id, 'thumb', 'webp')}
                        alt={photo.album?.title || 'Photo'}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-200"
                        sizes="80px"
                        onError={(e) => {
                          console.error('Timeline thumb image failed to load:', photo.id)
                          const img = e.target as HTMLImageElement
                          if (img.src.includes('webp')) {
                            img.src = getImageUrl(photo.id, 'thumb', 'jpeg')
                          } else {
                            img.src = getImageUrl(photo.id, 'small', 'webp')
                          }
                        }}
                      />
                    </div>
                  ))}
                  {additionalPhotos.length > 5 && (
                    <div className="relative aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        +{additionalPhotos.length - 5}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 照片信息 */}
            {mainPhoto.exifJson && (mainPhoto.exifJson as any).location && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{(mainPhoto.exifJson as any).location}</span>
              </div>
            )}
            
            {/* 标签 */}
            {group.photos[0].tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {group.photos[0].tags.slice(0, 3).map(({ tag }) => (
                  <span 
                    key={tag.id}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
                {group.photos[0].tags.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    +{group.photos[0].tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
      </div>
      
      <div className="space-y-12">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="relative">
            <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="absolute left-4 top-4 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="ml-16">
              <div className="bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse">
                <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-1" />
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="aspect-[16/9] bg-gray-300 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function TimelineContent() {
  const timelineGroups = await getTimelinePhotos()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          时间线
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          按时间顺序浏览你的照片，重温美好时光
        </p>
      </div>

      {timelineGroups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            暂时还没有照片
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            开始上传照片来创建你的时间线
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="space-y-0">
            {timelineGroups.map((group, index) => (
              <TimelineItem 
                key={group.date} 
                group={group} 
                index={index}
              />
            ))}
          </div>
          
          {/* 时间线结束标记 */}
          <div className="relative">
            <div className="absolute left-6 -top-6 w-px h-6 bg-gradient-to-b from-primary/50 to-transparent" />
            <div className="absolute left-4 top-0 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-900" />
            <div className="ml-16 text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                这是时间的开始 ✨
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<TimelineLoading />}>
      <TimelineContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
