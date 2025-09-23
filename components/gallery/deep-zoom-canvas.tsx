'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PhotoWithDetails } from '@/types'
import {
  getZoomSources,
  shouldEnableDeepZoom,
  detectDeepZoomCapability,
  type DeepZoomCapability,
} from '@/lib/lightbox/zoom-service'
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PhotoZoomCanvas } from './photo-zoom-canvas'

interface DeepZoomCanvasProps {
  photo: PhotoWithDetails
  enabled?: boolean
}

interface CachedSource {
  url: string
  width: number
  height: number
}

interface CacheHandle {
  db: IDBDatabase | null
}

const CACHE_NAME = 'ccframe-deep-zoom'
const CACHE_STORE = 'sources'
const CACHE_VERSION = 1
const MAX_CACHE_ENTRY_BYTES = 40 * 1024 * 1024

async function openCache(): Promise<CacheHandle> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return { db: null }
  }

  return new Promise<CacheHandle>((resolve) => {
    const request = window.indexedDB.open(CACHE_NAME, CACHE_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'url' })
      }
    }
    request.onsuccess = () => {
      resolve({ db: request.result })
    }
    request.onerror = () => {
      resolve({ db: null })
    }
  })
}

async function readCachedSource(handle: CacheHandle, url: string): Promise<Blob | null> {
  if (!handle.db) return null
  return new Promise((resolve) => {
    const tx = handle.db!.transaction(CACHE_STORE, 'readonly')
    const store = tx.objectStore(CACHE_STORE)
    const request = store.get(url)
    request.onsuccess = () => {
      const result = request.result as { blob?: Blob } | undefined
      resolve(result?.blob ?? null)
    }
    request.onerror = () => resolve(null)
  })
}

async function writeCachedSource(handle: CacheHandle, url: string, blob: Blob) {
  if (!handle.db) return
  return new Promise<void>((resolve) => {
    const tx = handle.db!.transaction(CACHE_STORE, 'readwrite')
    const store = tx.objectStore(CACHE_STORE)
    store.put({ url, blob, size: blob.size, updatedAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

export function DeepZoomCanvas({ photo, enabled = true }: DeepZoomCanvasProps) {
  const [capability, setCapability] = useState<DeepZoomCapability>(() => detectDeepZoomCapability())
  const [prefetched, setPrefetched] = useState<Map<string, CachedSource>>(new Map())
  const [sources, setSources] = useState(() => getZoomSources(photo))
  const objectUrlRef = useRef<Map<string, string>>(new Map())
  const cacheHandleRef = useRef<CacheHandle | null>(null)

  const shouldEnable = enabled && shouldEnableDeepZoom(photo) && capability !== 'low'
  const baseWidth = photo.width || 1

  useEffect(() => {
    setCapability(detectDeepZoomCapability())
  }, [])

  useEffect(() => {
    setSources(getZoomSources(photo))
  }, [photo])

  useEffect(() => {
    if (!shouldEnable) return
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await fetch(`/api/lightbox/zoom?${new URLSearchParams({ id: photo.id }).toString() }`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.sources) && data.sources.length > 0) {
          setSources(data.sources)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production' && (error as any)?.name !== 'AbortError') {
          console.warn('[DeepZoom] zoom API failed', error)
        }
      }
    })()
    return () => controller.abort()
  }, [shouldEnable, photo.id])

  useEffect(() => {
    let cancelled = false
    const abortController = new AbortController()

    const load = async () => {
      if (!shouldEnable || sources.length === 0) return

      if (!cacheHandleRef.current) {
        cacheHandleRef.current = await openCache()
      }

      for (const source of sources) {
        if (cancelled) break
        const cacheKey = source.url
        const existing = objectUrlRef.current.get(cacheKey)
        if (existing) continue

        try {
          let blob = await readCachedSource(cacheHandleRef.current!, cacheKey)
          if (!blob) {
            const response = await fetch(cacheKey, { signal: abortController.signal, cache: 'force-cache' })
            if (!response.ok) continue
            blob = await response.blob()
            if (blob.size > 0 && blob.size <= MAX_CACHE_ENTRY_BYTES) {
              await writeCachedSource(cacheHandleRef.current!, cacheKey, blob)
            }
          }

          if (cancelled || !blob) continue
          const objectUrl = URL.createObjectURL(blob)
          objectUrlRef.current.set(cacheKey, objectUrl)
          setPrefetched((prev) => {
            const next = new Map(prev)
            next.set(source.variant, { url: objectUrl, width: source.width, height: source.height })
            return next
          })
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[DeepZoom] failed to preload source', error)
          }
        }
      }
    }

    load()

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [sources, shouldEnable])

  useEffect(() => {
    const objectUrlMap = objectUrlRef.current
    const cacheHandle = cacheHandleRef.current

    return () => {
      for (const url of Array.from(objectUrlMap.values())) {
        URL.revokeObjectURL(url)
      }
      objectUrlMap.clear()

      if (cacheHandle?.db) {
        cacheHandle.db.close()
      }
      if (cacheHandleRef.current === cacheHandle) {
        cacheHandleRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    setPrefetched(new Map())
    for (const url of Array.from(objectUrlRef.current.values())) {
      URL.revokeObjectURL(url)
    }
    objectUrlRef.current.clear()
  }, [photo.id])

  const resolveSource = useCallback(
    (scale: number) => {
      if (!shouldEnable || sources.length === 0) return undefined
      const targetWidth = baseWidth * scale
      let chosen = sources[0]
      for (const source of sources) {
        if (source.width >= targetWidth - 200) {
          chosen = source
          break
        }
        chosen = source
      }

      const cached = prefetched.get(chosen.variant)
      return {
        src: cached?.url ?? chosen.url,
        width: cached?.width ?? chosen.width,
        height: cached?.height ?? chosen.height,
      }
    },
    [shouldEnable, sources, baseWidth, prefetched]
  )

  const showCapabilityBanner = enabled && capability === 'low' && Math.max(photo.width ?? 0, photo.height ?? 0) >= 2400
  const downloadUrl = useMemo(() => getImageUrl(photo.id, 'original', 'jpeg'), [photo.id])

  return (
    <div className="relative">
      <PhotoZoomCanvas photo={photo} resolveSource={shouldEnable ? resolveSource : undefined} />
      {showCapabilityBanner ? (
        <div className="pointer-events-auto absolute bottom-4 right-4 z-[5] max-w-xs rounded-2xl border border-white/10 bg-black/75 p-4 text-sm text-white shadow-lg backdrop-blur">
          <p className="mb-3 leading-relaxed text-white/80">
            当前设备性能较弱，为保障体验，深度放大已自动关闭。可下载原图查看完整细节。
          </p>
          <Button asChild size="sm" variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white/30">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              下载原图
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function shouldUseDeepZoom(photo: PhotoWithDetails, forced?: boolean): boolean {
  if (typeof forced === 'boolean') {
    return forced
  }
  return shouldEnableDeepZoom(photo)
}
