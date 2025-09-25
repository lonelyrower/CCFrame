"use client"

import { useState, useEffect, useCallback } from 'react'

export interface FavoriteItem {
  id: string
  type: 'photo' | 'album' | 'tag'
  title: string
  thumbnail?: string
  createdAt: Date
  metadata?: Record<string, any>
}

const FAVORITES_STORAGE_KEY = 'ccframe-favorites'
const MAX_FAVORITES = 500 // Prevent unlimited growth

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        const favorites = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }))
        setFavorites(favorites)
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteItem[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites))
      setFavorites(newFavorites)
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }, [])

  // Add to favorites
  const addToFavorites = useCallback((item: Omit<FavoriteItem, 'createdAt'>) => {
    const newItem: FavoriteItem = {
      ...item,
      createdAt: new Date()
    }

    setFavorites(current => {
      // Check if already exists
      if (current.some(fav => fav.id === item.id && fav.type === item.type)) {
        return current
      }

      // Add new item and maintain max limit
      const newFavorites = [newItem, ...current].slice(0, MAX_FAVORITES)
      saveFavorites(newFavorites)
      return newFavorites
    })
  }, [saveFavorites])

  // Remove from favorites
  const removeFromFavorites = useCallback((id: string, type: FavoriteItem['type']) => {
    setFavorites(current => {
      const newFavorites = current.filter(item =>
        !(item.id === id && item.type === type)
      )
      saveFavorites(newFavorites)
      return newFavorites
    })
  }, [saveFavorites])

  // Toggle favorite status
  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'createdAt'>) => {
    const isCurrentlyFavorited = favorites.some(
      fav => fav.id === item.id && fav.type === item.type
    )

    if (isCurrentlyFavorited) {
      removeFromFavorites(item.id, item.type)
    } else {
      addToFavorites(item)
    }
  }, [favorites, addToFavorites, removeFromFavorites])

  // Check if item is favorited
  const isFavorited = useCallback((id: string, type: FavoriteItem['type']) => {
    return favorites.some(fav => fav.id === id && fav.type === type)
  }, [favorites])

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([])
    localStorage.removeItem(FAVORITES_STORAGE_KEY)
  }, [])

  // Get favorites by type
  const getFavoritesByType = useCallback((type: FavoriteItem['type']) => {
    return favorites.filter(item => item.type === type)
  }, [favorites])

  // Get recent favorites
  const getRecentFavorites = useCallback((limit: number = 10) => {
    return favorites
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }, [favorites])

  // Search favorites
  const searchFavorites = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return favorites.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      (item.metadata?.description &&
        item.metadata.description.toLowerCase().includes(lowerQuery))
    )
  }, [favorites])

  // Export favorites (for backup)
  const exportFavorites = useCallback(() => {
    const dataStr = JSON.stringify(favorites, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ccframe-favorites-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [favorites])

  // Import favorites (for restore)
  const importFavorites = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string)
          if (Array.isArray(importedData)) {
            const validFavorites = importedData.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt)
            }))
            saveFavorites(validFavorites)
            resolve()
          } else {
            reject(new Error('Invalid file format'))
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [saveFavorites])

  return {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    clearFavorites,
    getFavoritesByType,
    getRecentFavorites,
    searchFavorites,
    exportFavorites,
    importFavorites,
    count: favorites.length
  }
}