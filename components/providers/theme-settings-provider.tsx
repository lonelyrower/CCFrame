'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ContrastMode = 'default' | 'high'
type MotionPreference = 'system' | 'reduce'

type ThemeSettingsContextValue = {
  contrast: ContrastMode
  motionPreference: MotionPreference
  resolvedMotion: 'normal' | 'reduce'
  toggleContrast: () => void
  setContrast: (mode: ContrastMode) => void
  setMotionPreference: (preference: MotionPreference) => void
}

const CONTRAST_STORAGE_KEY = 'ccframe:contrast-mode'
const MOTION_STORAGE_KEY = 'ccframe:motion-preference'

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | undefined>(undefined)

interface ThemeSettingsProviderProps {
  children: React.ReactNode
}

function readContrastPreference(): ContrastMode {
  if (typeof window === 'undefined') return 'default'
  const stored = window.localStorage.getItem(CONTRAST_STORAGE_KEY) as ContrastMode | null
  return stored === 'high' ? 'high' : 'default'
}

function readMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(MOTION_STORAGE_KEY) as MotionPreference | null
  return stored === 'reduce' ? 'reduce' : 'system'
}

function getSystemMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ThemeSettingsProvider({ children }: ThemeSettingsProviderProps) {
  const [contrast, setContrastState] = useState<ContrastMode>(() => readContrastPreference())
  const [motionPreference, setMotionPreferenceState] = useState<MotionPreference>(() => readMotionPreference())
  const [systemPrefersReduced, setSystemPrefersReduced] = useState<boolean>(() => getSystemMotionPreference())

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handler = (event: MediaQueryListEvent) => setSystemPrefersReduced(event.matches)
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    }
    return undefined
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (contrast === 'high') {
      root.classList.add('contrast-high')
    } else {
      root.classList.remove('contrast-high')
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, contrast)
    }
  }, [contrast])

  const resolvedMotion = useMemo<'normal' | 'reduce'>(() => {
    if (motionPreference === 'reduce') return 'reduce'
    return systemPrefersReduced ? 'reduce' : 'normal'
  }, [motionPreference, systemPrefersReduced])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (resolvedMotion === 'reduce') {
      root.classList.add('motion-reduce')
    } else {
      root.classList.remove('motion-reduce')
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MOTION_STORAGE_KEY, motionPreference)
    }
  }, [resolvedMotion, motionPreference])

  const toggleContrast = useCallback(() => {
    setContrastState((prev) => (prev === 'high' ? 'default' : 'high'))
  }, [])

  const setContrast = useCallback((mode: ContrastMode) => {
    setContrastState(mode)
  }, [])

  const setMotionPreference = useCallback((preference: MotionPreference) => {
    setMotionPreferenceState(preference)
  }, [])

  const value = useMemo<ThemeSettingsContextValue>(
    () => ({ contrast, motionPreference, resolvedMotion, toggleContrast, setContrast, setMotionPreference }),
    [contrast, motionPreference, resolvedMotion, toggleContrast, setContrast, setMotionPreference],
  )

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
}

export function useThemeSettings(): ThemeSettingsContextValue {
  const context = useContext(ThemeSettingsContext)
  if (!context) {
    throw new Error('useThemeSettings must be used within a ThemeSettingsProvider')
  }
  return context
}
