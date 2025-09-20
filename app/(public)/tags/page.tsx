import { Suspense } from 'react'
import { db } from '@/lib/db'
import { PhotoWithDetails } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Tag, Hash, ArrowRight } from 'lucide-react'
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
  const tags = await db.tag.findMany({
    select: {
      id: true,
      name: true,
      color: true,
      _count: {
        select: {
          photos: {
            where: {
              photo: {
                visibility: 'PUBLIC',
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      photos: {
        where: {
          photo: {
            visibility: 'PUBLIC',
            status: 'COMPLETED'
          }
        },
        include: {
          photo: {
            include: {
              variants: true,
              tags: {
                include: {
                  tag: true
                }
              },
              album: true
            }
          }
        },
        take: 6
      }
    },
    where: {
      photos: {
        some: {
          photo: {
            visibility: 'PUBLIC',
            status: 'COMPLETED'
          }
        }
      }
    },
    orderBy: {
      photos: {
        _count: 'desc'
      }
    }
  })

  return tags.map(tag => ({
    ...tag,
    photos: tag.photos.map(p => p.photo)
  }))
}

function TagCard({ tag }: { tag: TagWithCount }) {
  const tagColor = tag.color || '#6366f1'
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: tagColor + '20' }}
            >
              <Hash 
                className="w-5 h-5"
                style={{ color: tagColor }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {tag.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tag._count.photos} 张照片
              </p>
            </div>
          </div>
          <Link 
            href={`/photos?tag=${encodeURIComponent(tag.name)}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      {tag.photos.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {tag.photos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={getImageUrl(photo.id, 'thumb', 'webp')}
                  alt={photo.album?.title || 'Photo thumbnail'}
                  fill
                  sizes="(min-width: 1024px) 8vw, (min-width: 768px) 10vw, 33vw"
                  className="object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TagCloud({ tags }: { tags: TagWithCount[] }) {
  const maxCount = Math.max(...tags.map(t => t._count.photos))
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <Tag className="w-5 h-5" />
        标签云
      </h2>
      <div className="flex flex-wrap gap-3">
        {tags.map(tag => {
          const size = Math.max(0.75, (tag._count.photos / maxCount) * 1.5)
          const tagColor = tag.color || '#6366f1'
          
          return (
            <Link
              key={tag.id}
              href={`/photos?tag=${encodeURIComponent(tag.name)}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600 
                         hover:border-primary hover:bg-primary/5 transition-all duration-200"
              style={{
                fontSize: `${size}rem`,
                color: tagColor
              }}
            >
              <Hash className="w-4 h-4" />
              {tag.name}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tag._count.photos}
              </span>
            </Link>
          )
        })}
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
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          标签分类
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          通过标签发现和整理你的照片，共 {tags.length} 个标签
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tag className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            暂时还没有标签
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            开始为你的照片添加标签来更好地组织它们
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <TagCloud tags={tags} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map(tag => (
              <TagCard key={tag.id} tag={tag} />
            ))}
          </div>
        </>
      )}
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
