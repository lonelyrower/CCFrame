'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { UploadProgress } from '@/types'

export type UploadQueueStatus = UploadProgress['status'] | 'queued' | 'hashing'

export interface UploadQueueItem extends UploadProgress {
  status: UploadQueueStatus
  size?: number
  startedAt?: number
  updatedAt?: number
}

interface UploadQueueStats {
  total: number
  completed: number
  active: number
  failed: number
  pending: number
}

interface UploadQueueContextValue {
  items: UploadQueueItem[]
  stats: UploadQueueStats
  hasActive: boolean
  getItem: (id: string) => UploadQueueItem | undefined
  upsert: (item: UploadQueueItem) => void
  update: (id: string, patch: Partial<UploadQueueItem>) => void
  remove: (id: string) => void
  clear: () => void
}

const UploadQueueContext = createContext<UploadQueueContextValue | undefined>(undefined)

interface UploadQueueProviderProps {
  children: React.ReactNode
}

function computeStats(map: Map<string, UploadQueueItem>): UploadQueueStats {
  let completed = 0
  let active = 0
  let failed = 0
  let pending = 0

  map.forEach((item) => {
    switch (item.status) {
      case 'completed':
        completed += 1
        break
      case 'failed':
        failed += 1
        break
      case 'processing':
      case 'uploading':
        active += 1
        break
      default:
        pending += 1
    }
  })

  return {
    total: map.size,
    completed,
    active,
    failed,
    pending,
  }
}

export function UploadQueueProvider({ children }: UploadQueueProviderProps) {
  const [uploads, setUploads] = useState<Map<string, UploadQueueItem>>(new Map())

  const upsert = useCallback((item: UploadQueueItem) => {
    setUploads((prev) => {
      const next = new Map(prev)
      const existing = next.get(item.id)
      const timestamp = Date.now()
      next.set(item.id, {
        ...existing,
        ...item,
        startedAt: existing?.startedAt ?? item.startedAt ?? timestamp,
        updatedAt: timestamp,
      })
      return next
    })
  }, [])

  const update = useCallback((id: string, patch: Partial<UploadQueueItem>) => {
    setUploads((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      const existing = next.get(id)!
      next.set(id, {
        ...existing,
        ...patch,
        updatedAt: Date.now(),
      })
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setUploads((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setUploads(new Map())
  }, [])

  const items = useMemo(() => {
    return Array.from(uploads.values()).sort((a, b) => {
      const aTime = a.startedAt ?? 0
      const bTime = b.startedAt ?? 0
      return aTime - bTime
    })
  }, [uploads])

  const stats = useMemo(() => computeStats(uploads), [uploads])
  const hasActive = stats.active + stats.pending > 0

  const getItem = useCallback((id: string) => uploads.get(id), [uploads])

  const value = useMemo<UploadQueueContextValue>(() => ({
    items,
    stats,
    hasActive,
    getItem,
    upsert,
    update,
    remove,
    clear,
  }), [items, stats, hasActive, getItem, upsert, update, remove, clear])

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
    </UploadQueueContext.Provider>
  )
}

export function useUploadQueue(): UploadQueueContextValue {
  const context = useContext(UploadQueueContext)
  if (!context) {
    throw new Error('useUploadQueue must be used within an UploadQueueProvider')
  }
  return context
}
