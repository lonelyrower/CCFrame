'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react'
import type { PhotoWithDetails } from '@/types'
import type { StorySequence } from '@/types/lightbox'
import { buildStorySequence } from '@/lib/lightbox/story-service'

import {
  type LightboxMode,
  type LightboxViewportState,
  createInitialLightboxState,
  getCurrentPhoto,
  lightboxReducer,
} from './lightbox-store'

interface LightboxContextValue {
  photos: PhotoWithDetails[]
  index: number
  current: PhotoWithDetails | null
  isOpen: boolean
  helpOpen: boolean
  showInfoStack: boolean
  showFilmstrip: boolean
  mode: LightboxMode
  viewport: LightboxViewportState
  storySequence: StorySequence | null
  storyIndex: number
  go: (index: number) => void
  next: () => void
  prev: () => void
  close: () => void
  open: (id: string) => void
  openAt: (index: number) => void
  toggleHelp: () => void
  toggleInfoStack: () => void
  setInfoStackVisibility: (value: boolean) => void
  setMode: (mode: LightboxMode) => void
  setViewport: (viewport: Partial<LightboxViewportState>) => void
  resetViewport: () => void
  setFilmstripVisibility: (value: boolean) => void
  setStorySequence: (sequence: StorySequence | null) => void
  setStoryIndex: (index: number) => void
  nextStoryEntry: () => void
  prevStoryEntry: () => void
}

const LightboxContext = createContext<LightboxContextValue | null>(null)

export function LightboxProvider({ photos, children }: { photos: PhotoWithDetails[]; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(lightboxReducer, photos, createInitialLightboxState)

  useEffect(() => {
    dispatch({ type: 'SET_PHOTOS', photos })
  }, [photos])

  const autoSequence = useMemo(() => buildStorySequence(photos), [photos])
  const storySequenceState = state.storySequence

  useEffect(() => {
    if (!storySequenceState || storySequenceState.id.startsWith('auto-sequence-')) {
      dispatch({ type: 'SET_STORY_SEQUENCE', sequence: autoSequence })
    }
  }, [autoSequence, storySequenceState])

  const setStorySequence = useCallback((sequence: StorySequence | null) => {
    dispatch({ type: 'SET_STORY_SEQUENCE', sequence })
  }, [])

  const setStoryIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_STORY_INDEX', index })
  }, [])

  const nextStoryEntry = useCallback(() => {
    dispatch({ type: 'NEXT_STORY' })
  }, [])

  const prevStoryEntry = useCallback(() => {
    dispatch({ type: 'PREV_STORY' })
  }, [])

  const open = useCallback((id: string) => {
    dispatch({ type: 'OPEN_BY_ID', id })
  }, [])

  const openAt = useCallback((index: number) => {
    dispatch({ type: 'OPEN_BY_INDEX', index })
  }, [])

  const go = useCallback((index: number) => {
    dispatch({ type: 'GO', index })
  }, [])

  const next = useCallback(() => {
    dispatch({ type: 'NEXT' })
  }, [])

  const prev = useCallback(() => {
    dispatch({ type: 'PREV' })
  }, [])

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE' })
  }, [])

  const toggleHelp = useCallback(() => {
    dispatch({ type: 'TOGGLE_HELP' })
  }, [])

  const toggleInfoStack = useCallback(() => {
    dispatch({ type: 'TOGGLE_INFO_STACK' })
  }, [])

  const setInfoStackVisibility = useCallback((value: boolean) => {
    dispatch({ type: 'SET_INFO_STACK_VISIBILITY', value })
  }, [])

  const setMode = useCallback((mode: LightboxMode) => {
    dispatch({ type: 'SET_MODE', mode })
  }, [])

  const setViewport = useCallback((viewport: Partial<LightboxViewportState>) => {
    dispatch({ type: 'SET_VIEWPORT', viewport })
  }, [])

  const resetViewport = useCallback(() => {
    dispatch({ type: 'RESET_VIEWPORT' })
  }, [])

  const setFilmstripVisibility = useCallback((value: boolean) => {
    dispatch({ type: 'SET_FILMSTRIP_VISIBILITY', value })
  }, [])

  const value = useMemo<LightboxContextValue>(() => {
    const current = getCurrentPhoto(state)
    return {
      photos: state.photos,
      index: state.index,
      current,
      isOpen: state.isOpen,
      helpOpen: state.helpOpen,
      showInfoStack: state.showInfoStack,
      showFilmstrip: state.showFilmstrip,
      mode: state.mode,
      viewport: state.viewport,
      storySequence: state.storySequence,
      storyIndex: state.storyIndex,
      go,
      next,
      prev,
      close,
      open,
      openAt,
      toggleHelp,
      toggleInfoStack,
      setInfoStackVisibility,
      setMode,
      setViewport,
      resetViewport,
      setFilmstripVisibility,
      setStorySequence,
      setStoryIndex,
      nextStoryEntry,
      prevStoryEntry,
    }
  }, [state, go, next, prev, close, open, openAt, toggleHelp, toggleInfoStack, setInfoStackVisibility, setMode, setViewport, resetViewport, setFilmstripVisibility, setStorySequence, setStoryIndex, nextStoryEntry, prevStoryEntry])

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>
}

export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext)
  if (!ctx) {
    throw new Error('useLightbox must be used within LightboxProvider')
  }
  return ctx
}

export function useOptionalLightbox(): LightboxContextValue | null {
  return useContext(LightboxContext)
}

