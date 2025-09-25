"use client"

import React from 'react'

const { createContext, useContext, useMemo } = React

import { useAudioPreference, useReducedMotionSetting } from '@/hooks/use-motion-preferences'

interface PreferenceContextValue {
  reducedMotion: boolean
  setReducedMotion: (value: boolean) => void
  reducedMotionFromSystem: boolean
  audioEnabled: boolean
  setAudioEnabled: (value: boolean) => void
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null)

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion, { fromSystem }] = useReducedMotionSetting()
  const [audioEnabled, setAudioEnabled] = useAudioPreference(false)

  const value = useMemo<PreferenceContextValue>(
    () => ({ reducedMotion, setReducedMotion, reducedMotionFromSystem: fromSystem, audioEnabled, setAudioEnabled }),
    [reducedMotion, setReducedMotion, fromSystem, audioEnabled, setAudioEnabled],
  )

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>
}

export function usePreferenceContext(): PreferenceContextValue {
  const ctx = useContext(PreferenceContext)
  if (!ctx) {
    throw new Error('usePreferenceContext must be used within PreferenceProvider')
  }
  return ctx
}

export function useOptionalPreferenceContext(): PreferenceContextValue | null {
  return useContext(PreferenceContext)
}
