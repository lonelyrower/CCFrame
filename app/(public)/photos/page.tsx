import { Suspense } from 'react'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { LightboxProvider } from '@/components/gallery/lightbox-context'
import { PhotosFilters } from '@/components/gallery/photos-filters'
import type { PhotoWithDetails } from '@/types'
import { Grid } from 'lucide-react'

type SearchParams = {
  view?: string
  sort?: string
  album?: string
  tag?: string
  search?: string
}

const SORT_VALUES = new Set(['newest', 'oldest', 'name'])

function normalizeSort(value?: string) {
  if (value && SORT_VALUES.has(value)) return value as 'newest' | 'oldest' | 'name'
  return 'newest'
}

async function getPhotos(params: SearchParams): Promise<PhotoWithDetails[]> {
  const sort = normalizeSort(params.sort)
  const where: Prisma.PhotoWhereInput = {
    visibility: 'PUBLIC',
    status: 'COMPLETED',
  }

  if (params.album) {
    where.albumId = params.album
  }

  if (params.tag) {
    where.tags = {
      some: {
        tag: {
          name: {
            contains: params.tag,
            mode: 'insensitive',
          },
        },
      },
    }
  }

  if (params.search) {
    const term = params.search.trim()
    if (term) {
      where.OR = [
        {
          album: {
            title: {
              contains: term,
              mode: 'insensitive',
            },
          },
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: term,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ]
    }
  }

  let orderBy: Prisma.PhotoOrderByWithRelationInput = { createdAt: 'desc' }
  if (sort === 'oldest') {
    orderBy = { createdAt: 'asc' }
  } else if (sort === 'name') {
    orderBy = { album: { title: 'asc' } }
  }

  return db.photo.findMany({
    where,
    include: {
      variants: true,
      tags: { include: { tag: true } },
      album: true,
    },
    orderBy,
    take: 100,
  })
}

async function getFilterOptions() {
  const [albums, tags] = await Promise.all([
    db.album.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            photos: {
              where: {
                visibility: 'PUBLIC',
                status: 'COMPLETED',
              },
            },
          },
        },
      },
      where: {
        photos: {
          some: {
            visibility: 'PUBLIC',
            status: 'COMPLETED',
          },
        },
      },
      orderBy: { title: 'asc' },
    }),
    db.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            photos: {
              where: {
                photo: {
                  visibility: 'PUBLIC',
                  status: 'COMPLETED',
                },
              },
            },
          },
        },
      },
      where: {
        photos: {
          some: {
            photo: {
              visibility: 'PUBLIC',
              status: 'COMPLETED',
            },
          },
        },
      },
      orderBy: { photos: { _count: 'desc' } },
      take: 100,
    }),
  ])

  return {
    albums: albums.map((album) => ({ id: album.id, title: album.title, count: album._count.photos })),
    tags: tags.map((tag) => ({ id: tag.id, name: tag.name, count: tag._count.photos })),
  }
}

function PhotosLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
      </div>
      <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 mb-6 animate-pulse">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="w-32 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="w-32 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <MasonryGallery photos={[]} loading />
    </div>
  )
}

async function PhotosContent({ searchParams }: { searchParams: SearchParams }) {
  const normalized = {
    ...searchParams,
    sort: normalizeSort(searchParams.sort),
  }
  const [photos, filterOptions] = await Promise.all([
    getPhotos(normalized),
    getFilterOptions(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">全部照片</h1>
        <p className="text-gray-600 dark:text-gray-400">共 {photos.length} 张照片，记录着生活中的美好瞬间</p>
      </div>

      <PhotosFilters
        albums={filterOptions.albums}
        tags={filterOptions.tags}
        params={normalized}
      />

      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">没有找到匹配的照片</h3>
          <p className="text-gray-600 dark:text-gray-400">请尝试调整搜索条件或浏览其他分类</p>
        </div>
      ) : (
        <LightboxProvider photos={photos}>
          <MasonryGallery photos={photos} />
        </LightboxProvider>
      )}
    </div>
  )
}

export default function PhotosPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PhotosLoading />}>
      <PhotosContent searchParams={searchParams} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'

