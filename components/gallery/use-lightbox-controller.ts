import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'

import { useLightbox } from './lightbox-context'

interface UseLightboxControllerOptions {
  enableWheelZoom?: boolean
}

export interface LightboxControllerHandlers {
  handleBackdropPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  handleBackdropClick: (event: ReactPointerEvent<HTMLDivElement>) => void
  handleWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
}

const ZOOM_STEP = 0.15

export function useLightboxController({ enableWheelZoom = true }: UseLightboxControllerOptions = {}): LightboxControllerHandlers {
  const {
    isOpen,
    helpOpen,
    toggleHelp,
    next,
    prev,
    close,
    mode,
    storySequence,
    nextStoryEntry,
    prevStoryEntry,
    setMode,
  } = useLightbox()
  const pointerDownOnBackdrop = useRef(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      const toggleHelpRequested = event.key === '?' || (event.shiftKey && event.key === '/')
      if (toggleHelpRequested) {
        event.preventDefault()
        toggleHelp()
        return
      }

      if (helpOpen) return

      if (event.shiftKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault()
        const hasStory = storySequence && storySequence.entries.length > 0
        if (hasStory) {
          if (mode !== 'story') setMode('story')
          if (event.key === 'ArrowRight') nextStoryEntry()
          else prevStoryEntry()
        } else {
          if (event.key === 'ArrowRight') next()
          else prev()
        }
        return
      }

      const useStoryNavigation = mode === 'story' && storySequence && storySequence.entries.length > 0

      switch (event.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          if (useStoryNavigation) nextStoryEntry()
          else next()
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          if (useStoryNavigation) prevStoryEntry()
          else prev()
          break
        case '+':
        case '=':
          event.preventDefault()
          document.dispatchEvent(new CustomEvent('lightbox-zoom', { detail: { delta: ZOOM_STEP } }))
          break
        case '-':
        case '_':
          event.preventDefault()
          document.dispatchEvent(new CustomEvent('lightbox-zoom', { detail: { delta: -ZOOM_STEP } }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, helpOpen, toggleHelp, next, prev, close, mode, storySequence, nextStoryEntry, prevStoryEntry, setMode])

  const handleBackdropPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = event.target === event.currentTarget
  }, [])

  const handleBackdropClick = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerDownOnBackdrop.current) return
    if (event.target !== event.currentTarget) return
    close()
  }, [close])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!enableWheelZoom || !isOpen) return
    if (!event.ctrlKey) return

    event.preventDefault()
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    document.dispatchEvent(new CustomEvent('lightbox-zoom', { detail: { delta } }))
  }, [enableWheelZoom, isOpen])

  return {
    handleBackdropPointerDown,
    handleBackdropClick,
    handleWheel,
  }
}


