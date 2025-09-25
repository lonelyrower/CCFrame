'use client'

import React from 'react'

const { createContext, useCallback, useContext, useEffect, useState } = React

interface ColorPalette {
  dominant: string
  accent: string
  muted: string
  background: string
  text: string
  isDark: boolean
}

interface DynamicTheme {
  palette: ColorPalette | null
  isActive: boolean
  isLoading: boolean
  enableDynamicTheme: (palette: ColorPalette) => void
  disableDynamicTheme: () => void
  toggleDynamicTheme: () => void
}

const DEFAULT_PALETTE: ColorPalette = {
  dominant: '220 13% 18%',
  accent: '35 84% 62%',
  muted: '220 8% 62%',
  background: '220 15% 97%',
  text: '220 15% 12%',
  isDark: false
}

const DynamicThemeContext = createContext<DynamicTheme | undefined>(undefined)

interface DynamicThemeProviderProps {
  children: React.ReactNode
}

function applyColorPalette(palette: ColorPalette) {
  const root = document.documentElement

  // Apply the generated palette to CSS custom properties
  root.style.setProperty('--token-color-brand-primary', palette.dominant)
  root.style.setProperty('--token-color-brand-accent', palette.accent)
  root.style.setProperty('--token-color-text-primary', palette.text)
  root.style.setProperty('--token-color-text-secondary', palette.muted)
  root.style.setProperty('--token-color-surface-canvas', palette.background)

  // Generate interaction colors based on the accent
  const [h, s, l] = palette.accent.split(' ').map((v, i) => i === 0 ? parseInt(v) : parseInt(v.replace('%', '')))
  root.style.setProperty('--token-color-interaction-ring', palette.accent)
  root.style.setProperty('--token-color-interaction-focus', `${h} ${s}% ${Math.min(l + 20, 95)}%`)
  root.style.setProperty('--token-color-interaction-muted', `${h} ${s}% ${l}% / 0.1`)

  // Update surface colors with tint from dominant color
  const [dh, ds] = palette.dominant.split(' ').map((v, i) => i === 0 ? parseInt(v) : parseInt(v.replace('%', '')))
  root.style.setProperty('--token-color-surface-panel', `${dh} ${Math.max(5, ds * 0.3)}% ${palette.isDark ? '12' : '100'}% / 0.85`)
  root.style.setProperty('--token-color-surface-glass', `${dh} ${Math.max(8, ds * 0.4)}% ${palette.isDark ? '10' : '98'}% / 0.7`)
  root.style.setProperty('--token-color-surface-outline', `${dh} ${Math.max(5, ds * 0.4)}% ${palette.isDark ? '25' : '88'}%`)

  // Update gradients
  const dominantRgb = hslToRgb(dh, ds, palette.isDark ? 20 : 60)
  const accentRgb = hslToRgb(h, s, palette.isDark ? l + 10 : l - 10)

  const gradientPrimary = `linear-gradient(135deg, rgba(${accentRgb.join(', ')}, 0.15) 0%, rgba(${accentRgb.join(', ')}, 0.03) 100%)`
  const gradientSecondary = `radial-gradient(60% 60% at 50% 40%, rgba(${dominantRgb.join(', ')}, 0.12) 0%, rgba(${dominantRgb.join(', ')}, 0) 80%)`
  const gradientHero = `radial-gradient(circle at 25% 25%, rgba(${accentRgb.join(', ')}, 0.08), transparent 60%), radial-gradient(circle at 75% 15%, rgba(${dominantRgb.join(', ')}, 0.1), transparent 65%), linear-gradient(180deg, rgba(${palette.isDark ? '15, 20, 25' : '248, 249, 251'}, 0.96), rgba(${palette.isDark ? '15, 20, 25' : '248, 249, 251'}, 0.88))`

  root.style.setProperty('--token-gradient-glow-primary', gradientPrimary)
  root.style.setProperty('--token-gradient-glow-secondary', gradientSecondary)
  root.style.setProperty('--token-gradient-hero-backdrop', gradientHero)

  // Add smooth transition class
  root.classList.add('theme-transition-active')

  // Remove transition class after animation
  setTimeout(() => {
    root.classList.remove('theme-transition-active')
  }, 500)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100

  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }

  return [f(0), f(8), f(4)]
}

function resetToDefaultTheme() {
  const root = document.documentElement

  // Remove custom properties to fall back to CSS defaults
  const propsToReset = [
    '--token-color-brand-primary',
    '--token-color-brand-accent',
    '--token-color-text-primary',
    '--token-color-text-secondary',
    '--token-color-surface-canvas',
    '--token-color-surface-panel',
    '--token-color-surface-glass',
    '--token-color-surface-outline',
    '--token-color-interaction-ring',
    '--token-color-interaction-focus',
    '--token-color-interaction-muted',
    '--token-gradient-glow-primary',
    '--token-gradient-glow-secondary',
    '--token-gradient-hero-backdrop'
  ]

  propsToReset.forEach(prop => {
    root.style.removeProperty(prop)
  })

  root.classList.add('theme-transition-active')
  setTimeout(() => {
    root.classList.remove('theme-transition-active')
  }, 500)
}

export function DynamicThemeProvider({ children }: DynamicThemeProviderProps) {
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const enableDynamicTheme = useCallback((newPalette: ColorPalette) => {
    setIsLoading(true)
    setPalette(newPalette)
    setIsActive(true)

    // Smooth transition delay
    setTimeout(() => {
      applyColorPalette(newPalette)
      setIsLoading(false)
    }, 100)

    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('ccframe:dynamic-theme', JSON.stringify({
        enabled: true,
        palette: newPalette
      }))
    }
  }, [])

  const disableDynamicTheme = useCallback(() => {
    setIsLoading(true)
    setIsActive(false)

    setTimeout(() => {
      resetToDefaultTheme()
      setPalette(null)
      setIsLoading(false)
    }, 100)

    if (typeof window !== 'undefined') {
      localStorage.setItem('ccframe:dynamic-theme', JSON.stringify({
        enabled: false,
        palette: null
      }))
    }
  }, [])

  const toggleDynamicTheme = useCallback(() => {
    if (isActive) {
      disableDynamicTheme()
    } else if (palette) {
      enableDynamicTheme(palette)
    }
  }, [isActive, palette, enableDynamicTheme, disableDynamicTheme])

  // Load saved preference on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('ccframe:dynamic-theme')
      if (saved) {
        const { enabled, palette: savedPalette } = JSON.parse(saved)
        if (enabled && savedPalette) {
          setPalette(savedPalette)
          // Don't auto-enable on mount to avoid flash, let the hero component trigger it
        }
      }
    } catch (error) {
      console.warn('Failed to load dynamic theme preference:', error)
    }
  }, [])

  const value: DynamicTheme = {
    palette,
    isActive,
    isLoading,
    enableDynamicTheme,
    disableDynamicTheme,
    toggleDynamicTheme
  }

  return (
    <DynamicThemeContext.Provider value={value}>
      {children}
    </DynamicThemeContext.Provider>
  )
}

export function useDynamicTheme(): DynamicTheme {
  const context = useContext(DynamicThemeContext)
  if (!context) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider')
  }
  return context
}