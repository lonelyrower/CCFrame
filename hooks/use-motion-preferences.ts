"use client"

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'ccframe.motion.prefersReduced'

function readStoredPreference(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    return raw === 'true'
  } catch {
    return null
  }
}

function writeStoredPreference(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // ignore
  }
}

function detectSystemPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function useReducedMotionSetting(): [boolean, (value: boolean) => void, { fromSystem: boolean }] {
  const [state, setState] = useState(() => {
    const stored = readStoredPreference()
    if (stored !== null) {
      return { value: stored, fromSystem: false }
    }
    return { value: detectSystemPreference(), fromSystem: true }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = () => {
      setState((prev) => {
        if (readStoredPreference() !== null) {
          return prev
        }
        return { value: mql.matches, fromSystem: true }
      })
    }
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener)
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(listener)
    }
    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', listener)
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(listener)
      }
    }
  }, [])

  const setPreference = useCallback((value: boolean) => {
    setState({ value, fromSystem: false })
    writeStoredPreference(value)
  }, [])

  return [state.value, setPreference, { fromSystem: state.fromSystem }]
}

const AUDIO_KEY = 'ccframe.audio.prefersEnabled'

function readAudioPreference(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUDIO_KEY)
    if (raw === null) return null
    return raw === 'true'
  } catch {
    return null
  }
}

function writeAudioPreference(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(AUDIO_KEY, value ? 'true' : 'false')
  } catch {
    // ignore
  }
}

export function useAudioPreference(defaultEnabled: boolean = false): [boolean, (value: boolean) => void] {
  const [enabled, setEnabled] = useState(() => {
    const stored = readAudioPreference()
    return stored ?? defaultEnabled
  })

  const update = useCallback((value: boolean) => {
    setEnabled(value)
    writeAudioPreference(value)
  }, [])

  return [enabled, update]
}
