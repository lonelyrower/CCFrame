import { Suspense } from 'react'
import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Image as ImageIcon
} from 'lucide-react'
import { PhotoWithDetails } from '@/types'
import { LibraryBatchGrid } from '@/components/admin/library-batch-grid'
import { SeedDemoButton } from '@/components/admin/seed-demo-button'
import { PhotoTagsInline } from '@/components/admin/photo-tags-inline'
import { PhotoActions } from '@/components/admin/photo-actions'
import { LibraryStatsBar } from '@/components/admin/library-stats-bar'
import { requireAdmin } from '@/lib/admin-auth'

interface LibraryStats {
  total: number
  public: number
  private: number
  processing: number
}

async function getPhotos(page = 1, limit = 50, filter?: string): Promise<{
  photos: PhotoWithDetails[]
  stats: LibraryStats
  hasMore: boolean
}> {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) {
    if (guard.status === 401) {
      redirect('/admin/login')
    }
    if (guard.status === 403) {
      redirect('/admin/login?error=forbidden')
    }
    throw new Error('Admin access required')
  }

  const adminUserId = guard.adminUserId

  const where: Prisma.PhotoWhereInput | undefined = filter
    ? {
        OR: [
          // Match album title (case-insensitive not supported in current client types)
          { album: { is: { title: { contains: filter } } } },
          // Match tag name
          { tags: { some: { tag: { is: { name: { contains: filter } } } } } },
        ],
      }
    : undefined

  const baseWhere: Prisma.PhotoWhereInput = {
    userId: adminUserId,
    ...(where ?? {}),
  }

  const [photos, stats] = await Promise.all([
    db.photo
      .findMany({
        include: {
          variants: true,
          tags: {
            include: {
              tag: true,
            },
          },
          album: true,
        },
        where: baseWhere,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: (page - 1) * limit,
      })
      .then((rows) => rows as unknown as PhotoWithDetails[]),
    Promise.all([
      db.photo.count({ where: { userId: adminUserId, status: 'COMPLETED' } }),
      db.photo.count({ where: { userId: adminUserId, visibility: 'PUBLIC', status: 'COMPLETED' } }),
      db.photo.count({ where: { userId: adminUserId, visibility: 'PRIVATE', status: 'COMPLETED' } }),
      db.photo.count({ where: { userId: adminUserId, status: { in: ['UPLOADING', 'PROCESSING'] } } })
    ]).then(([total, publicCount, privateCount, processing]) => ({
      total,
      public: publicCount,
      private: privateCount,
      processing
    }))
  ])

  return {
    photos,
    stats,
    hasMore: photos.length === limit
  }
}


// Removed server-side placeholder actions; replaced by client component PhotoActions

function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg animate-pulse">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded mr-2" />
                <div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12 mb-2" />
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function LibraryContent({ searchParams }: { searchParams: { filter?: string; page?: string } }) {
  const { photos, stats, hasMore } = await getPhotos(
    parseInt(searchParams.page || '1'),
    50,
    searchParams.filter
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              照片库
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理所有已上传的照片
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索照片..."
                defaultValue={searchParams.filter || ''}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <LibraryStatsBar stats={stats} />

        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {searchParams.filter ? '没有找到匹配的照片' : '还没有照片'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchParams.filter ? '尝试修改搜索条件' : '上传一些照片开始使用，或导入示例图片快速预览效果'}
            </p>
            <div className="mt-6 flex justify-center">
              <SeedDemoButton count={12} />
            </div>
          </div>
        ) : (
          <LibraryBatchGrid initial={photos.map(p => ({ id: p.id, visibility: p.visibility as any, width: p.width, height: p.height, albumTitle: p.album?.title || null, tags: (p.tags || []).map((t: any) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) }))} />
        )}

        {hasMore && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              加载更多
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LibraryPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string }
}) {
  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryContent searchParams={searchParams} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
