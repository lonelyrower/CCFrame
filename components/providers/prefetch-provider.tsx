"use client"

import React from 'react'
import type { ReactNode } from 'react'

const { createContext, useCallback, useContext, useEffect, useMemo, useState } = React
import { usePathname } from 'next/navigation'

import { performanceMonitor, shouldDeferPrefetch } from '@/lib/performance-monitor'
import { queuePrefetch, resetPrefetchRegistry } from '@/lib/network/prefetcher'

type PrefetchFn = (urls: string | string[], options?: { immediate?: boolean }) => void

interface PrefetchContextValue {
  prefetch: PrefetchFn
  prefetchWhenIdle: PrefetchFn
  canPrefetch: boolean
}

const PrefetchContext = createContext<PrefetchContextValue | undefined>(undefined)

interface PrefetchProviderProps {
  children: ReactNode
}

export function PrefetchProvider({ children }: PrefetchProviderProps) {
  const pathname = usePathname()
  const [ready, setReady] = useState(() => typeof window === 'undefined')
  const [defer, setDefer] = useState(() => shouldDeferPrefetch())

  useEffect(() => {
    setDefer(shouldDeferPrefetch())
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
      setReady(true)
      return
    }

    let mounted = true
    navigator.serviceWorker.ready
      .then(() => {
        if (mounted) setReady(true)
      })
      .catch(() => {
        if (mounted) setReady(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    resetPrefetchRegistry()
    performanceMonitor.collectResourceSnapshot()
  }, [pathname])

  const canPrefetch = ready && !defer

  const prefetch = useCallback<PrefetchFn>((urls, options = {}) => {
    if (!canPrefetch) return
    queuePrefetch(urls, { immediate: true, ...options })
  }, [canPrefetch])

  const prefetchWhenIdle = useCallback<PrefetchFn>((urls, options = {}) => {
    if (!canPrefetch) return
    queuePrefetch(urls, { immediate: false, ...options })
  }, [canPrefetch])

  useEffect(() => {
    if (typeof window === 'undefined' || !canPrefetch) return

    const seen = new WeakSet<Element>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !entry.target) continue
        const element = entry.target as HTMLElement & { dataset?: DOMStringMap }
        const urls = element.dataset?.prefetchUrl
        if (!urls) continue
        const list = urls.split(',').map((item) => item.trim()).filter(Boolean)
        if (!list.length) continue
        queuePrefetch(list)
        observer.unobserve(element)
      }
    }, { rootMargin: '280px' })

    const scan = () => {
      const elements = document.querySelectorAll('[data-prefetch-url]')
      elements.forEach((element) => {
        if (seen.has(element)) return
        seen.add(element)
        observer.observe(element)
      })
    }

    scan()

    const mutationObserver = new MutationObserver(() => {
      if ('requestIdleCallback' in window) {
        ;(window as any).requestIdleCallback(() => scan())
      } else {
        setTimeout(() => scan(), 200)
      }
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [canPrefetch])

  const value = useMemo<PrefetchContextValue>(() => ({ prefetch, prefetchWhenIdle, canPrefetch }), [prefetch, prefetchWhenIdle, canPrefetch])

  return <PrefetchContext.Provider value={value}>{children}</PrefetchContext.Provider>
}

export function usePrefetch() {
  const ctx = useContext(PrefetchContext)
  if (!ctx) {
    throw new Error('usePrefetch must be used within PrefetchProvider')
  }
  return ctx
}



