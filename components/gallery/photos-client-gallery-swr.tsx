"use client"

import { useCallback, useEffect, useRef, memo } from 'react'
import { MasonryGallery } from './masonry-gallery'
import { LightboxProvider } from './lightbox-context'
import ErrorBoundary from '../error-boundary'
import { usePhotos } from '@/hooks/use-photos'
import type { PhotoWithDetails } from '@/types'

interface PhotosClientGallerySWRProps {
  baseQuery?: string
  album?: string
  tag?: string
  search?: string
  limit?: number
  fallbackData?: {
    photos: PhotoWithDetails[]
    nextCursor?: string | null
    total?: number
  }
}

export const PhotosClientGallerySWR = memo<PhotosClientGallerySWRProps>(function PhotosClientGallerySWR({
  baseQuery,
  album,
  tag,
  search,
  limit = 60,
  fallbackData
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)

  const {
    photos,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    total
  } = usePhotos({
    album,
    tag,
    search,
    limit,
    revalidateOnFocus: false
  })

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoadingMore || loadingRef.current) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (loadingRef.current) return
          loadingRef.current = true

          try {
            await loadMore()
          } catch (error) {
            console.error('Failed to load more photos:', error)
          } finally {
            loadingRef.current = false
          }
        }
      },
      { rootMargin: "400px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  // Reset loading ref when photos change
  useEffect(() => {
    loadingRef.current = false
  }, [photos.length])

  const totalLoaded = photos.length
  const completed = !hasMore

  if (isLoading && photos.length === 0) {
    return (
      <ErrorBoundary>
        <MasonryGallery photos={[]} loading={true} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <LightboxProvider photos={photos}>
        <MasonryGallery photos={photos} loading={false} />
        <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />

        {isLoadingMore && (
          <div className="py-4 text-center text-sm text-text-muted">
            Loading more photos...
          </div>
        )}

        {error && (
          <div className="py-2 text-center text-sm text-red-500">
            {error.message || 'Failed to load photos'}
            <button
              type="button"
              className="ml-2 underline"
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}

        {completed && photos.length > 0 && (
          <div className="py-4 text-center text-xs text-text-muted">
            All photos loaded ({total || totalLoaded})
          </div>
        )}

        {photos.length === 0 && !isLoading && !error && (
          <div className="py-8 text-center text-text-muted">
            <p>No photos found</p>
            {(album || tag || search) && (
              <button
                onClick={refresh}
                className="mt-2 text-sm text-blue-500 underline"
              >
                Refresh
              </button>
            )}
          </div>
        )}
      </LightboxProvider>
    </ErrorBoundary>
  )
})

PhotosClientGallerySWR.displayName = 'PhotosClientGallerySWR'