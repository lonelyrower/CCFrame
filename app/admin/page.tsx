import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  Camera, 
  FolderOpen, 
  Upload, 
  Clock,
  TrendingUp,
  Hard Drive,
  Eye,
  EyeOff
} from 'lucide-react'

interface Stats {
  totalPhotos: number
  totalAlbums: number
  publicPhotos: number
  privatePhotos: number
  recentUploads: number
  storageUsed: number
}

async function getStats(): Promise<Stats> {
  const [
    totalPhotos,
    totalAlbums,
    publicPhotos,
    privatePhotos,
    recentUploads
  ] = await Promise.all([
    db.photo.count({ where: { status: 'COMPLETED' } }),
    db.album.count(),
    db.photo.count({ where: { visibility: 'PUBLIC', status: 'COMPLETED' } }),
    db.photo.count({ where: { visibility: 'PRIVATE', status: 'COMPLETED' } }),
    db.photo.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ])

  // Calculate approximate storage (this would be more accurate with actual file sizes)
  const variants = await db.photoVariant.aggregate({
    _sum: {
      sizeBytes: true
    }
  })

  return {
    totalPhotos,
    totalAlbums,
    publicPhotos,
    privatePhotos,
    recentUploads,
    storageUsed: variants._sum.sizeBytes || 0
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function RecentPhotos() {
  const recentPhotos = await db.photo.findMany({
    where: { status: 'COMPLETED' },
    include: {
      album: true,
      variants: {
        where: { variant: 'thumb', format: 'webp' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  })

  if (recentPhotos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No photos uploaded yet
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {recentPhotos.map((photo) => (
        <div key={photo.id} className="group relative">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {photo.variants[0] && (
              <img
                src={`/api/image/${photo.id}/thumb?format=webp`}
                alt={photo.album?.title || 'Photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.visibility === 'PUBLIC' ? (
                <Eye className="h-6 w-6 text-white" />
              ) : (
                <EyeOff className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

async function StatsCards() {
  const stats = await getStats()

  const statItems = [
    {
      label: 'Total Photos',
      value: stats.totalPhotos.toLocaleString(),
      icon: Camera,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      label: 'Albums',
      value: stats.totalAlbums.toString(),
      icon: FolderOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      label: 'Recent Uploads',
      value: stats.recentUploads.toString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      label: 'Storage Used',
      value: formatBytes(stats.storageUsed),
      icon: HardDrive,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const stats = await getStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your photo gallery.
        </p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<LoadingStats />}>
        <StatsCards />
      </Suspense>

      {/* Visibility Breakdown */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Photo Visibility
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Public Photos</span>
              </div>
              <span className="text-sm font-semibold">{stats.publicPhotos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Private Photos</span>
              </div>
              <span className="text-sm font-semibold">{stats.privatePhotos}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex text-xs text-gray-500 mb-1">
              <span>Public</span>
              <span className="ml-auto">Private</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ 
                  width: `${stats.totalPhotos ? (stats.publicPhotos / stats.totalPhotos) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/upload"
              className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="font-medium">Upload Photos</span>
            </a>
            <a
              href="/admin/albums"
              className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FolderOpen className="h-5 w-5" />
              <span className="font-medium">Manage Albums</span>
            </a>
            <a
              href="/admin/ai"
              className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Clock className="h-5 w-5" />
              <span className="font-medium">AI Studio</span>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Photos */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Photos
        </h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
            <RecentPhotos />
          </Suspense>
        </div>
      </div>
    </div>
  )
}