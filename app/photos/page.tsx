import { Suspense } from 'react'
import { db } from '@/lib/db'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { PhotoWithDetails } from '@/types'
import { 
  Grid, 
  List, 
  Calendar, 
  MapPin, 
  Filter,
  Search,
  SlidersHorizontal
} from 'lucide-react'

interface SearchParams {
  view?: string
  sort?: string
  album?: string
  tag?: string
  search?: string
}

async function getPhotos(params: SearchParams): Promise<PhotoWithDetails[]> {
  const { sort = 'newest', album, tag, search } = params
  
  const where: any = {
    visibility: 'PUBLIC',
    status: 'COMPLETED'
  }
  
  if (album) {
    where.albumId = album
  }
  
  if (tag) {
    where.tags = {
      some: {
        tag: {
          name: {
            contains: tag,
            mode: 'insensitive'
          }
        }
      }
    }
  }
  
  if (search) {
    where.OR = [
      {
        album: {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        tags: {
          some: {
            tag: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      }
    ]
  }
  
  let orderBy: any = { createdAt: 'desc' }
  
  switch (sort) {
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'name':
      orderBy = { album: { title: 'asc' } }
      break
    case 'size':
      orderBy = { fileSize: 'desc' }
      break
  }

  const photos = await db.photo.findMany({
    where,
    include: {
      variants: true,
      tags: {
        include: {
          tag: true
        }
      },
      album: true
    },
    orderBy,
    take: 100
  })

  return photos
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
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      where: {
        photos: {
          some: {
            visibility: 'PUBLIC',
            status: 'COMPLETED'
          }
        }
      }
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
                  status: 'COMPLETED'
                }
              }
            }
          }
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
      }
    })
  ])
  
  return { albums, tags }
}

function FilterSection({ albums, tags, params }: { 
  albums: any[], 
  tags: any[], 
  params: SearchParams 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索照片、相册或标签..."
              defaultValue={params.search || ''}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        
        <select 
          defaultValue={params.sort || 'newest'}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="name">按名称</option>
          <option value="size">按大小</option>
        </select>
        
        <select 
          defaultValue={params.album || ''}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">所有相册</option>
          {albums.map(album => (
            <option key={album.id} value={album.id}>
              {album.title} ({album._count.photos})
            </option>
          ))}
        </select>
        
        <select 
          defaultValue={params.tag || ''}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">所有标签</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.name}>
              {tag.name} ({tag._count.photos})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function PhotosLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
    </div>
  )
}

async function PhotosContent({ searchParams }: { searchParams: SearchParams }) {
  const [photos, filterOptions] = await Promise.all([
    getPhotos(searchParams),
    getFilterOptions()
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            全部照片
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            共 {photos.length} 张照片，记录生活中的美好瞬间
          </p>
        </div>

        <FilterSection 
          albums={filterOptions.albums}
          tags={filterOptions.tags}
          params={searchParams}
        />

        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Grid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              没有找到匹配的照片
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              尝试调整搜索条件或浏览其他内容
            </p>
          </div>
        ) : (
          <MasonryGallery photos={photos} />
        )}
      </div>
    </div>
  )
}

export default function PhotosPage({ 
  searchParams 
}: { 
  searchParams: SearchParams 
}) {
  return (
    <Suspense fallback={<PhotosLoading />}>
      <PhotosContent searchParams={searchParams} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
