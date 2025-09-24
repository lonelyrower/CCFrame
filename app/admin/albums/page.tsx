import { Suspense } from 'react'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { db } from '@/lib/db'
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
import { requireAdmin } from '@/lib/admin-auth'

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

  return await db.album.findMany({
    where: {
      userId: guard.adminUserId
    },
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
    <div className="bg-surface-panel dark:bg-surface-panel rounded-lg border border-surface-outline/40 dark:border-surface-outline/70 overflow-hidden hover:shadow-surface transition-shadow">
      <div className="aspect-video bg-surface-panel dark:bg-surface-panel relative">
        {album.coverPhoto ? (
          <Image
            src={`/api/image/${album.coverPhoto.id}/medium`}
            alt={`Album cover for ${album.title}`}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-12 h-12 text-text-muted" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPublic 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-surface-panel text-text-primary dark:bg-surface-panel dark:text-text-muted'
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
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-inverted truncate">
              {album.title}
            </h3>
            {album.description && (
              <p className="text-sm text-text-secondary dark:text-text-muted mt-1 line-clamp-2">
                {album.description}
              </p>
            )}
            <div className="flex items-center mt-3 space-x-4 text-sm text-text-muted dark:text-text-muted">
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
            <button className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
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
    <div className="min-h-screen bg-surface-canvas dark:bg-surface-canvas">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-surface-panel dark:bg-surface-panel rounded w-32 animate-pulse mb-2" />
          <div className="h-4 bg-surface-panel dark:bg-surface-panel rounded w-64 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface-panel dark:bg-surface-panel rounded-lg animate-pulse">
              <div className="aspect-video bg-surface-panel dark:bg-surface-panel rounded-t-lg" />
              <div className="p-4">
                <div className="h-4 bg-surface-panel dark:bg-surface-panel rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-panel dark:bg-surface-panel rounded w-1/2 mb-3" />
                <div className="flex justify-between">
                  <div className="h-3 bg-surface-panel dark:bg-surface-panel rounded w-1/4" />
                  <div className="h-3 bg-surface-panel dark:bg-surface-panel rounded w-1/4" />
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
    <div className="min-h-screen bg-surface-canvas dark:bg-surface-canvas">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverted">
              相册管理
            </h1>
            <p className="text-text-secondary dark:text-text-muted mt-1">
              管理你的照片相册，创建新相册并整理照片
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin/albums/smart"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-text-inverted rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              智能相册
            </Link>
            <Link
              href="/admin/albums/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-text-inverted rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建相册
            </Link>
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-surface-panel dark:bg-surface-panel rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-12 h-12 text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary dark:text-text-inverted">
              还没有相册
            </h3>
            <p className="text-text-secondary dark:text-text-muted mb-6">
              创建你的第一个相册来整理照片
            </p>
            <Link
              href="/admin/albums/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-text-inverted rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建相册
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-text-secondary dark:text-text-muted">
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

