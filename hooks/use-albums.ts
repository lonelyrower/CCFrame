'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { trackApiCall } from '@/lib/performance-monitor'
import { useCSRF } from './use-csrf'

interface Album {
  id: string
  title: string
  description?: string
  coverPhoto?: {
    id: string
    fileKey: string
  }
  photoCount: number
  createdAt: Date
  updatedAt: Date
}

interface CreateAlbumData {
  title: string
  description?: string
}

interface UpdateAlbumData {
  title?: string
  description?: string
}

const fetcher = async (url: string): Promise<Album[]> => {
  const tracker = trackApiCall(url)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    tracker.onComplete()

    return Array.isArray(data) ? data.map(deserializeAlbum) : []
  } catch (error) {
    tracker.onError(error)
    throw error
  }
}

function deserializeAlbum(raw: any): Album {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
  }
}

export function useAlbums() {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<Album[]>('/api/albums', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3
  })

  const refresh = useCallback(() => {
    return mutate()
  }, [mutate])

  return {
    albums: data || [],
    isLoading,
    isValidating,
    error,
    refresh,
    mutate
  }
}

export function useAlbum(albumId: string) {
  const { data, error, isLoading, mutate } = useSWR<Album>(
    albumId ? `/api/albums/${albumId}` : null,
    async (url) => {
      const tracker = trackApiCall(url)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        tracker.onComplete()

        return deserializeAlbum(data)
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
    album: data,
    isLoading,
    error,
    refresh: mutate
  }
}

export function useAlbumMutations() {
  const { secureRequest } = useCSRF()
  const { mutate: mutateAlbums } = useAlbums()

  const createAlbum = useCallback(async (albumData: CreateAlbumData): Promise<Album> => {
    const tracker = trackApiCall('POST /api/albums')

    try {
      const response = await secureRequest('/api/albums', {
        method: 'POST',
        body: JSON.stringify(albumData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create album: ${response.statusText}`)
      }

      const newAlbum = await response.json()
      tracker.onComplete()

      // Update albums cache
      await mutateAlbums((current) => {
        if (!current) return [deserializeAlbum(newAlbum)]
        return [...current, deserializeAlbum(newAlbum)]
      }, false)

      return deserializeAlbum(newAlbum)
    } catch (error) {
      tracker.onError(error)
      throw error
    }
  }, [secureRequest, mutateAlbums])

  const updateAlbum = useCallback(async (albumId: string, albumData: UpdateAlbumData): Promise<Album> => {
    const tracker = trackApiCall(`PUT /api/albums/${albumId}`)

    try {
      const response = await secureRequest(`/api/albums/${albumId}`, {
        method: 'PUT',
        body: JSON.stringify(albumData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update album: ${response.statusText}`)
      }

      const updatedAlbum = await response.json()
      tracker.onComplete()

      // Update albums cache
      await mutateAlbums((current) => {
        if (!current) return [deserializeAlbum(updatedAlbum)]
        return current.map(album =>
          album.id === albumId ? deserializeAlbum(updatedAlbum) : album
        )
      }, false)

      return deserializeAlbum(updatedAlbum)
    } catch (error) {
      tracker.onError(error)
      throw error
    }
  }, [secureRequest, mutateAlbums])

  const deleteAlbum = useCallback(async (albumId: string): Promise<void> => {
    const tracker = trackApiCall(`DELETE /api/albums/${albumId}`)

    try {
      const response = await secureRequest(`/api/albums/${albumId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete album: ${response.statusText}`)
      }

      tracker.onComplete()

      // Update albums cache
      await mutateAlbums((current) => {
        if (!current) return []
        return current.filter(album => album.id !== albumId)
      }, false)
    } catch (error) {
      tracker.onError(error)
      throw error
    }
  }, [secureRequest, mutateAlbums])

  return {
    createAlbum,
    updateAlbum,
    deleteAlbum
  }
}