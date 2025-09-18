import { Suspense } from 'react'
import { db } from '@/lib/db'
import { MasonryGallery } from '@/components/gallery/masonry-gallery'
import { PhotosClientGallery } from '@/components/gallery/photos-client-gallery'
import { PhotosFilters } from '@/components/gallery/photos-filters'
import { PhotoWithDetails } from '@/types'
import {
  Grid,
  List,
  Calendar,
  MapPin,
  Filter,
  SlidersHorizontal
} from 'lucide-react'

interface SearchParams {
  view?: string
  sort?: string
  album?: string
  tag?: string
  search?: string
}

async function getPhotos(params: SearchParams): Promise<{ photos: PhotoWithDetails[]; nextCursor: string | null; total: number }> {
  // 暂时返回空数据，演示界面效果
  return { photos: [], nextCursor: null, total: 0 }
}

interface AlbumOption {
  id: string
  title: string
  _count: { photos: number }
}

interface TagOption {
  id: string
  name: string
  _count: { photos: number }
}

async function getFilterOptions(): Promise<{ albums: AlbumOption[]; tags: TagOption[] }> {
  // 暂时返回空数据，演示界面效果
  return { albums: [], tags: [] }
}

function buildBaseQuery(params: SearchParams): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return
    if (key === 'cursor' || key === 'limit') return
    qs.set(key, value as string)
  })
  return qs.toString()
}

async function PhotosContent({ searchParams }: { searchParams: SearchParams }) {
  const [{ photos, nextCursor, total }, filterOptions] = await Promise.all([
    getPhotos(searchParams),
    getFilterOptions()
  ])
  const baseQuery = buildBaseQuery(searchParams)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Photo library</h1>
        <p className="text-gray-600 dark:text-gray-400">Showing {total} processed photos from the public collection</p>
      </div>

      <PhotosFilters
        albums={filterOptions.albums}
        tags={filterOptions.tags}
        params={searchParams}
      />

      {total === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No photos matched your filters</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting the filters or browse a different album</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <PhotosClientGallery
            initialPhotos={photos}
            initialCursor={nextCursor}
            baseQuery={baseQuery}
            initialTotal={total}
          />
        </div>
      )}
    </div>
  )
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

