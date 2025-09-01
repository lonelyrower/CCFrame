import { Suspense } from 'react'
import { db } from '@/lib/db'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { PhotoWithDetails } from '@/types'

async function getFeaturedPhotos(): Promise<PhotoWithDetails[]> {
  const photos = await db.photo.findMany({
    where: {
      visibility: 'PUBLIC',
      status: 'COMPLETED'
    },
    include: {
      variants: true,
      tags: {
        include: {
          tag: true
        }
      },
      album: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  return photos
}

function GalleryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96 mt-2 animate-pulse" />
      </div>
      <MasonryGallery photos={[]} loading />
    </div>
  )
}

async function GalleryContent() {
  const photos = await getFeaturedPhotos()

  if (photos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to My Gallery</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          No photos have been shared yet. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Photo Gallery</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A collection of moments captured and memories preserved
        </p>
      </div>
      
      <MasonryGallery photos={photos} />
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<GalleryLoading />}>
        <GalleryContent />
      </Suspense>
    </main>
  )
}

export const revalidate = 3600 // Revalidate every hour
export const dynamic = 'force-dynamic' // Prevent static generation