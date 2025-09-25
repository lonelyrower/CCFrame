"use client"

import React from 'react'

const { createContext, useCallback, useContext, useEffect, useMemo, useState } = React

import type { PhotoWithDetails } from '@/types'
import type { CatalogFavoriteSnapshot } from '@/types/catalog'

import { useOptionalCatalogEventBus } from './catalog-event-bus'

type FavoriteState = {
  items: CatalogFavoriteSnapshot[]
  count: number
  toggle: (photo: PhotoWithDetails) => void
  remove: (id: string) => void
  clear: () => void
  isFavorite: (id: string) => boolean
  syncing: boolean
}

export const FavoriteContext = createContext<FavoriteState | null>(null)

const STORAGE_KEY = 'catalog:favorites'

function toSnapshot(photo: PhotoWithDetails): CatalogFavoriteSnapshot {
  return {
    id: photo.id,
    title: photo.title ?? photo.album?.title ?? null,
    albumTitle: photo.album?.title ?? null,
    primaryTag: photo.tags?.[0]?.tag.name ?? null,
  }
}

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map<string, CatalogFavoriteSnapshot>>(new Map())
  const [syncing] = useState(false)
  const eventBus = useOptionalCatalogEventBus()

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const restored = new Map<string, CatalogFavoriteSnapshot>()
        parsed.forEach((item) => {
          if (item && item.id) {
            restored.set(String(item.id), item)
          }
        })
        setMap(restored)
      }
    } catch (error) {
      console.warn('Failed to restore favorites', error)
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const serialized = JSON.stringify(Array.from(map.values()))
      window.localStorage.setItem(STORAGE_KEY, serialized)
    } catch (error) {
      console.warn('Failed to persist favorites', error)
    }
  }, [map])

  const toggle = useCallback((photo: PhotoWithDetails) => {
    setMap((prev) => {
      const next = new Map(prev)
      let snapshot: CatalogFavoriteSnapshot | null
      let action: 'add' | 'remove'

      if (next.has(photo.id)) {
        snapshot = next.get(photo.id) ?? null
        action = 'remove'
        next.delete(photo.id)
      } else {
        snapshot = toSnapshot(photo)
        action = 'add'
        next.set(photo.id, snapshot)
      }

      eventBus?.emit('favorites:toggle', {
        id: photo.id,
        action,
        snapshot,
        total: next.size,
      })

      return next
    })
  }, [eventBus])

  const remove = useCallback((id: string) => {
    setMap((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      const snapshot = next.get(id) ?? null
      next.delete(id)
      eventBus?.emit('favorites:toggle', {
        id,
        action: 'remove',
        snapshot,
        total: next.size,
      })
      return next
    })
  }, [eventBus])

  const clear = useCallback(() => {
    setMap((prev) => {
      if (prev.size === 0) return prev
      const previousIds = Array.from(prev.keys())
      eventBus?.emit('favorites:clear', { previousIds })
      return new Map()
    })
  }, [eventBus])

  const items = useMemo(() => Array.from(map.values()), [map])
  const ids = useMemo(() => new Set(map.keys()), [map])

  const value = useMemo<FavoriteState>(() => ({
    items,
    count: items.length,
    toggle,
    remove,
    clear,
    isFavorite: (id: string) => ids.has(id),
    syncing,
  }), [items, toggle, remove, clear, ids, syncing])

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>
}

export function useFavorites(): FavoriteState {
  const value = useContext(FavoriteContext)
  if (!value) {
    throw new Error('useFavorites must be used within FavoriteProvider')
  }
  return value
}

export function useOptionalFavorites(): FavoriteState | null {
  return useContext(FavoriteContext)
}


