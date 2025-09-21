'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useCSRF } from './use-csrf'
import { trackApiCall } from '@/lib/performance-monitor'

interface Tag {
  id: string
  name: string
  color?: string | null
}

interface PhotoTagsResponse {
  tags: Tag[]
}

const fetcher = async (url: string): Promise<PhotoTagsResponse> => {
  const tracker = trackApiCall(url)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    tracker.onComplete()

    return {
      tags: Array.isArray(data.tags) ? data.tags : []
    }
  } catch (error) {
    tracker.onError(error)
    throw error
  }
}

export function usePhotoTagsSWR(photoId: string) {
  const { secureRequest } = useCSRF()

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<PhotoTagsResponse>(
    photoId ? `/api/photos/${photoId}/tags` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      dedupingInterval: 30000
    }
  )

  const addTag = useCallback(async (name: string): Promise<Tag> => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw new Error('Tag name cannot be empty')
    }

    // Check for duplicates (case-insensitive)
    const existingTags = data?.tags || []
    const exists = existingTags.some(
      tag => tag.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (exists) {
      toast.error('标签已存在')
      throw new Error('Tag already exists')
    }

    const tracker = trackApiCall(`POST /api/photos/${photoId}/tags`)

    // Optimistic update
    const tempTag: Tag = {
      id: `temp-${Date.now()}`,
      name: trimmedName,
      color: '#6b7280'
    }

    const optimisticData = {
      tags: [...existingTags, tempTag]
    }

    try {
      // Update cache optimistically
      await mutate(optimisticData, false)

      const response = await secureRequest(`/api/photos/${photoId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName })
      })

      if (!response.ok) {
        throw new Error(`Failed to add tag: ${response.statusText}`)
      }

      const result = await response.json()
      const newTag = result.tag
      tracker.onComplete()

      // Replace temp tag with real tag
      const finalData = {
        tags: existingTags.map(tag =>
          tag.id === tempTag.id ? newTag : tag
        ).concat(existingTags.find(tag => tag.id === tempTag.id) ? [] : [newTag])
      }

      await mutate(finalData, false)
      toast.success('标签已添加')

      return newTag
    } catch (error) {
      tracker.onError(error)

      // Revert optimistic update
      await mutate({ tags: existingTags }, false)

      const errorMessage = error instanceof Error ? error.message : '添加标签失败'
      toast.error(errorMessage)
      throw error
    }
  }, [photoId, data, mutate, secureRequest])

  const removeTag = useCallback(async (tagId: string): Promise<void> => {
    const existingTags = data?.tags || []
    const tagToRemove = existingTags.find(tag => tag.id === tagId)

    if (!tagToRemove) {
      throw new Error('Tag not found')
    }

    const tracker = trackApiCall(`DELETE /api/photos/${photoId}/tags/${tagId}`)

    // Optimistic update
    const optimisticData = {
      tags: existingTags.filter(tag => tag.id !== tagId)
    }

    try {
      // Update cache optimistically
      await mutate(optimisticData, false)

      const response = await secureRequest(`/api/photos/${photoId}/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to remove tag: ${response.statusText}`)
      }

      tracker.onComplete()
      toast.success('标签已移除')
    } catch (error) {
      tracker.onError(error)

      // Revert optimistic update
      await mutate({ tags: existingTags }, false)

      const errorMessage = error instanceof Error ? error.message : '移除标签失败'
      toast.error(errorMessage)
      throw error
    }
  }, [photoId, data, mutate, secureRequest])

  const refresh = useCallback(() => {
    return mutate()
  }, [mutate])

  return {
    tags: data?.tags || [],
    isLoading,
    isValidating,
    error,
    addTag,
    removeTag,
    refresh
  }
}

// Hook for managing all available tags
export function useAllTags() {
  const { data, error, isLoading, mutate } = useSWR<Tag[]>(
    '/api/tags',
    async (url) => {
      const tracker = trackApiCall(url)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        tracker.onComplete()

        return Array.isArray(data) ? data : []
      } catch (error) {
        tracker.onError(error)
        throw error
      }
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      dedupingInterval: 60000 // 1 minute
    }
  )

  return {
    tags: data || [],
    isLoading,
    error,
    refresh: mutate
  }
}