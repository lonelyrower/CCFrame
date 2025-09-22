import { Suspense } from 'react'
import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import {
  Image as ImageIcon
} from 'lucide-react'
import { PhotoWithDetails } from '@/types'
import { LibraryBatchGrid } from '@/components/admin/library-batch-grid'
import { SeedDemoButton } from '@/components/admin/seed-demo-button'
import { PhotoTagsInline } from '@/components/admin/photo-tags-inline'
import { PhotoActions } from '@/components/admin/photo-actions'
import { LibraryStatsBar } from '@/components/admin/library-stats-bar'
import { LibraryControls } from '@/components/admin/library-controls'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
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
  )
}

async function LibraryContent({ searchParams }: { searchParams: { filter?: string; page?: string; view?: string } }) {
  const { photos, stats, hasMore } = await getPhotos(
    parseInt(searchParams.page || '1'),
    50,
    searchParams.filter
  )

  return (
    <div className="space-y-12 pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-6">
        <AnimateOnScroll>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Heading size="lg">库管理</Heading>
              <Text tone="secondary">管理所有已上传的资产，调整可见性并保持元数据同步。</Text>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <SeedDemoButton count={12} />
              <LibraryControls
                initialFilter={searchParams.filter}
                initialViewMode={(searchParams.view as 'grid' | 'list') || 'grid'}
              />
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.08}>
          <Surface tone="panel" padding="lg" className="shadow-subtle">
            <LibraryStatsBar stats={stats} className="gap-4" />
          </Surface>
        </AnimateOnScroll>

        {photos.length === 0 ? (
          <AnimateOnScroll delay={0.12}>
            <Surface tone="panel" padding="lg" className="flex flex-col items-center gap-4 text-center shadow-subtle">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-canvas">
                <ImageIcon className="h-12 w-12 text-text-muted" />
              </div>
              <Heading size="md">暂无照片</Heading>
              <Text tone="secondary">
                {searchParams.filter
                  ? '尝试调整过滤条件以找到更多图片。'
                  : '上传新的照片或使用示例数据快速填充图库。'}
              </Text>
              <div className="flex justify-center">
                <SeedDemoButton count={12} />
              </div>
            </Surface>
          </AnimateOnScroll>
        ) : (
          <AnimateOnScroll delay={0.12}>
            <LibraryBatchGrid
              initial={photos.map((photo) => ({
                id: photo.id,
                visibility: photo.visibility as any,
                width: photo.width,
                height: photo.height,
                albumTitle: photo.album?.title || null,
                tags: (photo.tags || []).map((tag) => ({
                  id: tag.tag.id,
                  name: tag.tag.name,
                  color: tag.tag.color,
                })),
              }))}
            />
          </AnimateOnScroll>
        )}

        {hasMore && (
          <AnimateOnScroll delay={0.18}>
            <div className="flex justify-center">
              <button className="rounded-full border border-surface-outline/60 bg-surface-panel/80 px-6 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-panel">
                加载更多
              </button>
            </div>
          </AnimateOnScroll>
        )}
      </Container>
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


