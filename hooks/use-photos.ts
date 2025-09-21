'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import type { PhotoWithDetails } from '@/types'
import { trackApiCall } from '@/lib/performance-monitor'

interface PhotosResponse {
  photos: PhotoWithDetails[]
  nextCursor?: string | null
  total?: number
}

interface UsePhotosOptions {
  limit?: number
  cursor?: string | null
  album?: string
  tag?: string
  search?: string
  revalidateOnFocus?: boolean
  refreshInterval?: number
}

const fetcher = async (url: string): Promise<PhotosResponse> => {
  const tracker = trackApiCall(url)

  try {
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    tracker.onComplete()

    return {
      photos: Array.isArray(data.photos) ? data.photos.map(deserializePhoto) : [],
      nextCursor: data.nextCursor ?? null,
      total: data.total ?? 0
    }
  } catch (error) {
    tracker.onError(error)
    throw error
  }
}

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

function buildQueryString(options: UsePhotosOptions): string {
  const params = new URLSearchParams()

  if (options.limit) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.album) params.set('album', options.album)
  if (options.tag) params.set('tag', options.tag)
  if (options.search) params.set('search', options.search)

  return params.toString()
}

export function usePhotos(options: UsePhotosOptions = {}) {
  const queryString = buildQueryString(options)
  const key = queryString ? `/api/photos?${queryString}` : '/api/photos'

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<PhotosResponse>(key, fetcher, {
    revalidateOnFocus: options.revalidateOnFocus ?? false,
    refreshInterval: options.refreshInterval ?? 0,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 3,
    errorRetryInterval: 1000
  })

  const loadMore = useCallback(async () => {
    if (!data?.nextCursor || isValidating) return null

    const nextOptions = { ...options, cursor: data.nextCursor }
    const nextQueryString = buildQueryString(nextOptions)
    const nextKey = `/api/photos?${nextQueryString}`

    try {
      const nextData = await fetcher(nextKey)

      // Merge with existing data
      if (data) {
        const mergedData: PhotosResponse = {
          photos: [...data.photos, ...nextData.photos],
          nextCursor: nextData.nextCursor,
          total: nextData.total || data.total
        }

        // Update current key with merged data
        await mutate(mergedData, false)
        return mergedData
      }

      return nextData
    } catch (error) {
      console.error('Failed to load more photos:', error)
      throw error
    }
  }, [data, isValidating, options, mutate])

  const refresh = useCallback(() => {
    return mutate()
  }, [mutate])

  return {
    photos: data?.photos || [],
    nextCursor: data?.nextCursor,
    total: data?.total || 0,
    hasMore: Boolean(data?.nextCursor),
    isLoading,
    isLoadingMore: isValidating && Boolean(data),
    error,
    loadMore,
    refresh,
    mutate
  }
}

// Hook for a single photo
export function usePhoto(photoId: string) {
  const { data, error, isLoading, mutate } = useSWR<PhotoWithDetails>(
    photoId ? `/api/photos/${photoId}` : null,
    async (url) => {
      const tracker = trackApiCall(url)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        tracker.onComplete()

        return deserializePhoto(data)
      } catch (error) {
        tracker.onError(error)
        throw error
      }
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 0
    }
  )

  return {
    photo: data,
    isLoading,
    error,
    refresh: mutate
  }
}