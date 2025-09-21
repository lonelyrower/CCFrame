import { Suspense } from 'react'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { LightboxProvider } from '@/components/gallery/lightbox-context'
import { Lightbox } from '@/components/gallery/lightbox'
import { PhotosFilters } from '@/components/gallery/photos-filters'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
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
              
            },
          },
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: term,
                  
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
    <div className="space-y-12 pb-20 pt-10 sm:pt-16">
      <Container size="xl" bleed="none" className="space-y-6">
        <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded-lg bg-surface-outline/40" />
            <div className="h-4 w-64 rounded-lg bg-surface-outline/30" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-10 rounded-lg bg-surface-outline/30" />
            ))}
          </div>
        </Surface>
        <Surface tone="panel" padding="lg" className="shadow-subtle">
          <MasonryGallery photos={[]} loading />
        </Surface>
      </Container>
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
    <div className="space-y-12 pb-20 pt-10 sm:pt-16">
      <Container size="xl" bleed="none" className="flex flex-col gap-6">
        <AnimateOnScroll>
          <div className="space-y-3">
            <Heading size="lg">全部照片</Heading>
            <Text tone="secondary" size="sm">
              浏览 {photos.length} 张已处理作品，可使用过滤器按相册、标签或关键字快速定位。
            </Text>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.06}>
          <Surface tone="panel" padding="lg" className="shadow-subtle">
            <PhotosFilters
              albums={filterOptions.albums}
              tags={filterOptions.tags}
              params={normalized}
              variant="plain"
            />
          </Surface>
        </AnimateOnScroll>
      </Container>

      <Container size="xl" bleed="none">
        {photos.length === 0 ? (
          <AnimateOnScroll>
            <Surface tone="panel" padding="lg" className="flex flex-col items-center gap-4 text-center shadow-subtle">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-canvas">
                <Grid className="h-12 w-12 text-text-muted" />
              </div>
              <Heading size="sm">暂无匹配照片</Heading>
              <Text tone="secondary" size="sm">尝试调整搜索条件或改用其他标签与相册筛选。</Text>
            </Surface>
          </AnimateOnScroll>
        ) : (
          <AnimateOnScroll delay={0.1}>
            <LightboxProvider photos={photos}>
              <MasonryGallery photos={photos} />
              <Lightbox />
            </LightboxProvider>
          </AnimateOnScroll>
        )}
      </Container>
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

