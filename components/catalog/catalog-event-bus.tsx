"use client"

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'

import type { PhotoWithDetails } from '@/types'
import type {
  CatalogFavoriteSnapshot,
  CatalogFilterPatch,
} from '@/types/catalog'

type CatalogEventPayloads = {
  'filters:update': { patch: CatalogFilterPatch; timestamp: number }
  'favorites:toggle': { id: string; action: 'add' | 'remove'; snapshot: CatalogFavoriteSnapshot | null; total: number }
  'favorites:clear': { previousIds: string[] }
  'compare:update': { items: PhotoWithDetails[]; ids: string[] }
}

export type CatalogEventType = keyof CatalogEventPayloads

export interface CatalogEventBus {
  emit<T extends CatalogEventType>(type: T, payload: CatalogEventPayloads[T]): void
  subscribe<T extends CatalogEventType>(type: T, handler: (payload: CatalogEventPayloads[T]) => void): () => void
}

const CatalogEventBusContext = createContext<CatalogEventBus | null>(null)

type ListenerMap = Map<CatalogEventType, Set<(payload: unknown) => void>>

export function CatalogEventBusProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<ListenerMap>(new Map())

  const bus = useMemo<CatalogEventBus>(() => ({
    emit(type, payload) {
      const listeners = listenersRef.current.get(type)
      if (!listeners) return
      listeners.forEach((listener) => {
        try {
          listener(payload)
        } catch (error) {
          console.error('[CatalogEventBus] listener error', error)
        }
      })
    },
    subscribe(type, handler) {
      const listeners = listenersRef.current.get(type) ?? new Set()
      listeners.add(handler as (payload: unknown) => void)
      listenersRef.current.set(type, listeners)
      return () => {
        const set = listenersRef.current.get(type)
        if (!set) return
        set.delete(handler as (payload: unknown) => void)
        if (set.size === 0) {
          listenersRef.current.delete(type)
        }
      }
    },
  }), [])

  return (
    <CatalogEventBusContext.Provider value={bus}>{children}</CatalogEventBusContext.Provider>
  )
}

export function useCatalogEventBus(): CatalogEventBus {
  const bus = useContext(CatalogEventBusContext)
  if (!bus) {
    throw new Error('useCatalogEventBus must be used within CatalogEventBusProvider')
  }
  return bus
}

export function useOptionalCatalogEventBus(): CatalogEventBus | null {
  return useContext(CatalogEventBusContext)
}
