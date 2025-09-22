"use client"

import { ReactNode, useEffect } from 'react'
import Lenis from 'lenis'

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { featureFlags } from '@/lib/config/feature-flags'
import { useThemeSettings } from './theme-settings-provider'
import { useOptionalPreferenceContext } from '@/components/context/preference-provider'

const isSmoothScrollEnabled = featureFlags.enableSmoothScroll

interface LenisProviderProps {
  children: ReactNode
}

export function LenisProvider({ children }: LenisProviderProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { resolvedMotion } = useThemeSettings()
  const preference = useOptionalPreferenceContext()
  const shouldReduceMotion = preference ? preference.reducedMotion : prefersReducedMotion || resolvedMotion === 'reduce'

  useEffect(() => {
    if (!isSmoothScrollEnabled || shouldReduceMotion) {
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 1.8),
      smoothWheel: true,
    })

    let frameId: number
    const raf = (time: number) => {
      lenis.raf(time)
      frameId = requestAnimationFrame(raf)
    }

    frameId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frameId)
      lenis.destroy()
    }
  }, [shouldReduceMotion])

  return <>{children}</>
}

