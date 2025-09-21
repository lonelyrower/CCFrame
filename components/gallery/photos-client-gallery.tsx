"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { MasonryGallery } from './masonry-gallery'
import { LightboxProvider } from './lightbox-context'
import ErrorBoundary from '../error-boundary'
import { usePhotos } from '@/hooks/use-photos'
import type { PhotoWithDetails } from '@/types'

interface PhotosClientGalleryProps {
  initialPhotos: PhotoWithDetails[]
  initialCursor: string | null
  baseQuery: string
  initialTotal: number
}

const PAGE_LIMIT = 60

function deserializePhoto(raw: any): PhotoWithDetails {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    takenAt: raw.takenAt ? new Date(raw.takenAt) : null,
    tags: raw.tags || [],
    variants: raw.variants || [],
  }
}

export const PhotosClientGallery = memo<PhotosClientGalleryProps>(function PhotosClientGallery({ initialPhotos, initialCursor, baseQuery, initialTotal }) {
  const [photos, setPhotos] = useState<PhotoWithDetails[]>(() => initialPhotos.map(deserializePhoto))
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(initialTotal)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingRef = useRef(false)

  const baseParams = useMemo(() => new URLSearchParams(baseQuery), [baseQuery])
  const hasMore = Boolean(cursor)

  useEffect(() => {
    setPhotos(initialPhotos.map(deserializePhoto))
    setCursor(initialCursor)
    setError(null)
    setTotal(initialTotal)
  }, [initialPhotos, initialCursor, initialTotal, baseQuery])

  const loadMore = useCallback(async () => {
    if (!cursor || fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams(baseParams)
      params.set('cursor', cursor)
      params.set('limit', String(PAGE_LIMIT))
      const res = await fetch(`/api/photos?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json() as { photos?: any[]; nextCursor?: string | null }
      setCursor(data.nextCursor ?? null)
      const incomingRaw = Array.isArray(data.photos) ? data.photos : []
      if (incomingRaw.length) {
        setPhotos(prev => {
          const existing = new Set(prev.map(p => p.id))
          const incoming = incomingRaw
            .filter(item => item && item.id && !existing.has(item.id))
            .map(deserializePhoto)
          if (!incoming.length) return prev
          return [...prev, ...incoming]
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more photos')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [baseParams, cursor])

  useEffect(() => {
    if (!hasMore) return
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadMore()
      }
    }, { rootMargin: '400px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const totalLoaded = photos.length
  const completed = totalLoaded >= total || !hasMore

  return (
    <ErrorBoundary>
      <LightboxProvider photos={photos}>
        <MasonryGallery photos={photos} loading={loading && photos.length === 0} />
        <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />
        {loading && photos.length > 0 && (
          <div className="py-4 text-center text-sm text-gray-500">Loading more photos...</div>
        )}
        {error && (
          <div className="py-2 text-center text-sm text-red-500">
            {error}
            {hasMore && (
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => loadMore()}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {completed && (
          <div className="py-4 text-center text-xs text-gray-400">All photos loaded ({total})</div>
        )}
      </LightboxProvider>
    </ErrorBoundary>
  )
})
