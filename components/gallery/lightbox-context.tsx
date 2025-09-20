"use client"
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import type { PhotoWithDetails } from '@/types'

interface LightboxContextValue {
  photos: PhotoWithDetails[]
  index: number
  current: PhotoWithDetails
  go: (i: number) => void
  next: () => void
  prev: () => void
  close: () => void
  open: (id: string) => void
  isOpen: boolean
  helpOpen: boolean
  toggleHelp: () => void
}

export const LightboxContext = createContext<LightboxContextValue | null>(null)

export function LightboxProvider({ photos, children }: { photos: PhotoWithDetails[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Safe access to photos - ensure we have valid data
  const safePhotos = useMemo(() => photos || [], [photos])
  const hasPhotos = safePhotos.length > 0

  const go = useCallback((i: number) => {
    if (!hasPhotos) return
    setIndex((prev) => {
      if (i < 0) return 0
      if (i >= safePhotos.length) return safePhotos.length - 1
      return i
    })
  }, [safePhotos.length, hasPhotos])

  const open = useCallback((id: string) => {
    if (!hasPhotos) return
    const i = safePhotos.findIndex(p => p.id === id)
    if (i >= 0) {
      setIndex(i)
      setIsOpen(true)
    }
  }, [safePhotos, hasPhotos])

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])
  const close = useCallback(() => setIsOpen(false), [])
  const toggleHelp = useCallback(() => setHelpOpen(h => !h), [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || !hasPhotos) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key === '?') { toggleHelp(); return }
      if (helpOpen) return // ignore navigation while help overlay visible
      switch (e.key) {
        case 'ArrowRight':
        case 'd':
          next(); break
        case 'ArrowLeft':
        case 'a':
          prev(); break
        case '+':
        case '=':
          // Custom event for zoom in
          document.dispatchEvent(new CustomEvent('lightbox-zoom', { detail: { delta: 0.2 } }))
          break
        case '-':
        case '_':
          document.dispatchEvent(new CustomEvent('lightbox-zoom', { detail: { delta: -0.2 } }))
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, helpOpen, next, prev, close, toggleHelp, hasPhotos])

  const value = useMemo(() => {
    if (!hasPhotos) {
      return null
    }
    return {
      photos: safePhotos,
      index,
      current: safePhotos[index] || safePhotos[0],
      go,
      next,
      prev,
      close,
      open,
      isOpen,
      helpOpen,
      toggleHelp,
    }
  }, [safePhotos, index, go, next, prev, close, open, isOpen, helpOpen, toggleHelp, hasPhotos])

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>
}

export function useLightbox() {
  const ctx = useContext(LightboxContext)
  if (!ctx) throw new Error('useLightbox must be used within LightboxProvider')
  return ctx
}

// Optional hook: returns null instead of throwing when not wrapped.
export function useOptionalLightbox() {
  return useContext(LightboxContext)
}
