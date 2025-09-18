import { Suspense } from 'react'
import { db } from '@/lib/db'
import { PhotoWithDetails } from '@/types'
import Link from 'next/link'
import { Tag, Hash, Image, ArrowRight } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

interface TagWithCount {
  id: string
  name: string
  color?: string
  _count: {
    photos: number
  }
  photos: PhotoWithDetails[]
}

async function getTags(): Promise<TagWithCount[]> {
  // 暂时返回空数据，演示界面效果
  return []
}

function TagCard({ tag }: { tag: TagWithCount }) {
  const tagColor = tag.color || '#8b5cf6'
  
  return (
    <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 shadow-lg">
      {/* 背景光晕效果 */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${tagColor}05, ${tagColor}10)`
        }}
      />
      
      <div className="relative z-10">
        {/* 标签头部 */}
        <div className="p-6 border-b border-gray-100/80 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${tagColor}, ${tagColor}cc)`,
                }}
              >
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {tag.name}
                </h3>
                <p className="text-sm font-medium" style={{ color: tagColor }}>
                  {tag._count.photos} 张精彩照片
                </p>
              </div>
            </div>
            <Link 
              href={`/photos?tag=${encodeURIComponent(tag.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {/* 照片预览网格 */}
        {tag.photos.length > 0 && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              {tag.photos.slice(0, 6).map((photo, index) => (
                <div 
                  key={photo.id} 
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <img
                    src={getImageUrl(photo.id, 'thumb', 'webp')}
                    alt={photo.album?.title || 'Photo'}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
            
            {/* 如果照片数量超过6张，显示更多提示 */}
            {tag._count.photos > 6 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1.5 rounded-full">
                  还有 {tag._count.photos - 6} 张照片...
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TagCloud({ tags }: { tags: TagWithCount[] }) {
  const maxCount = Math.max(...tags.map(t => t._count.photos))
  
  return (
    <div className="relative">
      {/* 背景装饰 */}
      <div className="absolute -inset-4 bg-gradient-to-r from-purple-200/20 via-pink-200/20 to-indigo-200/20 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-indigo-900/10 rounded-3xl blur-3xl" />
      
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 dark:border-gray-700/50 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
              <Tag className="w-6 h-6 text-white" />
            </div>
            标签云
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            点击任意标签探索相关照片，标签大小代表照片数量
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {tags.map(tag => {
            const size = Math.max(0.8, (tag._count.photos / maxCount) * 1.8)
            const tagColor = tag.color || '#8b5cf6'
            
            return (
              <Link
                key={tag.id}
                href={`/photos?tag=${encodeURIComponent(tag.name)}`}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                style={{
                  fontSize: `${size}rem`,
                  backgroundColor: `${tagColor}15`,
                  borderColor: `${tagColor}40`,
                  color: tagColor,
                  border: `2px solid ${tagColor}40`
                }}
              >
                <Hash className="w-4 h-4" />
                <span className="font-medium">{tag.name}</span>
                <span className="text-xs bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded-full font-bold text-gray-600 dark:text-gray-300 group-hover:bg-white/80 transition-colors">
                  {tag._count.photos}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TagsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
      </div>
      
      <div className="bg-gray-200 dark:bg-gray-800 rounded-xl p-6 mb-8 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-4" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full" style={{width: Math.random() * 60 + 60}} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse">
            <div className="p-6 border-b border-gray-300 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                <div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-1" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="aspect-square bg-gray-300 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function TagsContent() {
  const tags = await getTags()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">标签</h1>
        <p className="text-gray-600 dark:text-gray-400">探索全部标签与精彩照片</p>
      </div>

      <TagCloud tags={tags} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => (
          <TagCard key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  )
}

export default function TagsPage() {
  return (
    <Suspense fallback={<TagsLoading />}>
      <TagsContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
