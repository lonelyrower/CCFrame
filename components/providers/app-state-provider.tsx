'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import { mutate } from 'swr'
import toast from 'react-hot-toast'

interface AppStateContextType {
  // Global state mutations
  invalidatePhotos: () => Promise<void>
  invalidateAlbums: () => Promise<void>
  invalidatePhoto: (photoId: string) => Promise<void>
  invalidateAlbum: (albumId: string) => Promise<void>
  invalidatePhotoTags: (photoId: string) => Promise<void>

  // Global loading states
  isOnline: boolean

  // Global error handling
  handleError: (error: Error, context?: string) => void

  // Cache management
  clearCache: () => Promise<void>
  preloadPhoto: (photoId: string) => Promise<void>
  preloadAlbum: (albumId: string) => Promise<void>
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

interface AppStateProviderProps {
  children: ReactNode
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  // Cache invalidation helpers
  const invalidatePhotos = useCallback(async () => {
    await mutate(
      key => typeof key === 'string' && key.startsWith('/api/photos'),
      undefined,
      { revalidate: true }
    )
  }, [])

  const invalidateAlbums = useCallback(async () => {
    await mutate(
      key => typeof key === 'string' && key.startsWith('/api/albums'),
      undefined,
      { revalidate: true }
    )
  }, [])

  const invalidatePhoto = useCallback(async (photoId: string) => {
    await mutate(`/api/photos/${photoId}`, undefined, { revalidate: true })
    await mutate(
      key => typeof key === 'string' && key.includes(photoId),
      undefined,
      { revalidate: true }
    )
  }, [])

  const invalidateAlbum = useCallback(async (albumId: string) => {
    await mutate(`/api/albums/${albumId}`, undefined, { revalidate: true })
    await mutate(
      key => typeof key === 'string' && key.includes(`album=${albumId}`),
      undefined,
      { revalidate: true }
    )
  }, [])

  const invalidatePhotoTags = useCallback(async (photoId: string) => {
    await mutate(`/api/photos/${photoId}/tags`, undefined, { revalidate: true })
    // Also invalidate the photo itself as tags are part of photo data
    await invalidatePhoto(photoId)
  }, [invalidatePhoto])

  // Error handling
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`App Error${context ? ` (${context})` : ''}:`, error)

    // Determine error type and show appropriate message
    const message = error.message?.toLowerCase() || ''

    if (message.includes('network') || message.includes('fetch')) {
      toast.error('网络连接问题，请检查您的连接')
    } else if (message.includes('unauthorized') || message.includes('401')) {
      toast.error('请重新登录')
    } else if (message.includes('forbidden') || message.includes('403')) {
      toast.error('权限不足')
    } else if (message.includes('not found') || message.includes('404')) {
      toast.error('资源未找到')
    } else if (message.includes('timeout')) {
      toast.error('请求超时，请重试')
    } else if (context) {
      toast.error(`${context}失败: ${error.message}`)
    } else {
      toast.error('操作失败，请重试')
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service like Sentry
      console.error('Production error to be reported:', error)
    }
  }, [])

  // Cache management
  const clearCache = useCallback(async () => {
    await mutate(() => true, undefined, { revalidate: false })
    toast.success('缓存已清理')
  }, [])

  // Preloading helpers
  const preloadPhoto = useCallback(async (photoId: string) => {
    try {
      await mutate(`/api/photos/${photoId}`)
    } catch (error) {
      console.warn('Failed to preload photo:', photoId, error)
    }
  }, [])

  const preloadAlbum = useCallback(async (albumId: string) => {
    try {
      await mutate(`/api/albums/${albumId}`)
    } catch (error) {
      console.warn('Failed to preload album:', albumId, error)
    }
  }, [])

  // Online/offline detection
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  const value: AppStateContextType = {
    invalidatePhotos,
    invalidateAlbums,
    invalidatePhoto,
    invalidateAlbum,
    invalidatePhotoTags,
    isOnline,
    handleError,
    clearCache,
    preloadPhoto,
    preloadAlbum
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}

// Utility hook for network status
export function useNetworkStatus() {
  const { isOnline } = useAppState()
  return { isOnline, isOffline: !isOnline }
}