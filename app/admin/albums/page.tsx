import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Image as ImageIcon,
  Calendar
} from 'lucide-react'

interface Album {
  id: string
  title: string
  description: string | null
  visibility: string
  createdAt: Date
  updatedAt: Date
  _count: {
    photos: number
  }
  coverPhoto?: {
    id: string
  } | null
}

async function getAlbums(): Promise<Album[]> {
  const session = await getServerSession(authOptions)
  if (!session) return []

  return await db.album.findMany({
    include: {
      _count: {
        select: {
          photos: {
            where: {
              status: 'COMPLETED'
            }
          }
        }
      },
      coverPhoto: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}

function AlbumCard({ album }: { album: Album }) {
  const isPublic = album.visibility === 'PUBLIC'
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
        {album.coverPhoto ? (
          <img
            src={`/api/image/${album.coverPhoto.id}/medium`}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPublic 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {isPublic ? (
              <><Eye className="w-3 h-3 inline mr-1" />公开</>
            ) : (
              <><EyeOff className="w-3 h-3 inline mr-1" />私密</>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {album.title}
            </h3>
            {album.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {album.description}
              </p>
            )}
            <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-1" />
                {album._count.photos} 张照片
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {album.updatedAt.toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AlbumsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse">
              <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-t-lg" />
              <div className="p-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-3" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function AlbumsContent() {
  const albums = await getAlbums()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              相册管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理你的照片相册，创建新相册并整理照片
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin/albums/smart"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              智能相册
            </Link>
            <Link
              href="/admin/albums/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建相册
            </Link>
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              还没有相册
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              创建你的第一个相册来整理照片
            </p>
            <Link
              href="/admin/albums/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建相册
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              共 {albums.length} 个相册
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {albums.map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AlbumsPage() {
  return (
    <Suspense fallback={<AlbumsLoading />}>
      <AlbumsContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'