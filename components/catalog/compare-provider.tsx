"use client"

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { PhotoWithDetails } from '@/types'

import { useOptionalCatalogEventBus } from './catalog-event-bus'

interface CompareContextValue {
  items: PhotoWithDetails[]
  add: (photo: PhotoWithDetails) => void
  remove: (id: string) => void
  clear: () => void
  isComparing: (id: string) => boolean
}

export const CompareContext = createContext<CompareContextValue | null>(null)
const MAX_ITEMS = 4

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PhotoWithDetails[]>([])
  const eventBus = useOptionalCatalogEventBus()

  const emitUpdate = useCallback((list: PhotoWithDetails[]) => {
    eventBus?.emit('compare:update', { items: list, ids: list.map((item) => item.id) })
  }, [eventBus])

  const add = useCallback((photo: PhotoWithDetails) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === photo.id)) return prev
      const next = [...prev, photo]
      const trimmed = next.length > MAX_ITEMS ? next.slice(next.length - MAX_ITEMS) : next
      emitUpdate(trimmed)
      return trimmed
    })
  }, [emitUpdate])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      if (!prev.some((item) => item.id === id)) return prev
      const next = prev.filter((item) => item.id !== id)
      emitUpdate(next)
      return next
    })
  }, [emitUpdate])

  const clear = useCallback(() => {
    setItems((prev) => {
      if (prev.length === 0) return prev
      emitUpdate([])
      return []
    })
  }, [emitUpdate])

  const value = useMemo<CompareContextValue>(() => ({
    items,
    add,
    remove,
    clear,
    isComparing: (id: string) => items.some((item) => item.id === id),
  }), [add, clear, items, remove])

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareContextValue {
  const value = useContext(CompareContext)
  if (!value) {
    throw new Error('useCompare must be used within CompareProvider')
  }
  return value
}

export function useOptionalCompare(): CompareContextValue | null {
  return useContext(CompareContext)
}
