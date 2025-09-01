import { Suspense } from 'react'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Download,
  Image as ImageIcon
} from 'lucide-react'
import { PhotoWithDetails } from '@/types'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { SeedDemoButton } from '@/components/admin/seed-demo-button'

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
  const session = await getServerSession(authOptions)
  if (!session) {
    return { photos: [], stats: { total: 0, public: 0, private: 0, processing: 0 }, hasMore: false }
  }

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
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: (page - 1) * limit,
      })
      .then((rows) => rows as unknown as PhotoWithDetails[]),
    Promise.all([
      db.photo.count({ where: { status: 'COMPLETED' } }),
      db.photo.count({ where: { visibility: 'PUBLIC', status: 'COMPLETED' } }),
      db.photo.count({ where: { visibility: 'PRIVATE', status: 'COMPLETED' } }),
      db.photo.count({ where: { status: { in: ['UPLOADING', 'PROCESSING'] } } })
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

function StatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总照片</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Eye className="w-5 h-5 text-green-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">公开</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.public}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <EyeOff className="w-5 h-5 text-orange-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">私密</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.private}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <ImageIcon className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">处理中</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.processing}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoActions({ photo }: { photo: PhotoWithDetails }) {
  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-1 bg-black/50 rounded-md p-1">
        <button 
          className="p-1 text-white hover:bg-white/20 rounded transition-colors"
          title="编辑"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          className="p-1 text-white hover:bg-white/20 rounded transition-colors"
          title={photo.visibility === 'PUBLIC' ? '设为私密' : '设为公开'}
        >
          {photo.visibility === 'PUBLIC' ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
        <button 
          className="p-1 text-white hover:bg-white/20 rounded transition-colors"
          title="下载"
        >
          <Download className="w-4 h-4" />
        </button>
        <button 
          className="p-1 text-white hover:bg-red-600 rounded transition-colors"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

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

        <StatsBar stats={stats} />

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={`/api/image/${photo.id}/small`}
                  alt={photo.album?.title || 'Photo'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                <PhotoActions photo={photo} />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="text-white text-sm">
                    {photo.album?.title && (
                      <div className="font-medium mb-1">{photo.album.title}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          photo.visibility === 'PUBLIC'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {photo.visibility === 'PUBLIC' ? '公开' : '私密'}
                        </div>
                        {photo.status !== 'COMPLETED' && (
                          <div className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                            {photo.status === 'PROCESSING' ? '处理中' : '上传中'}
                          </div>
                        )}
                      </div>
                      <div className="text-xs opacity-75">
                        {photo.width} × {photo.height}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
