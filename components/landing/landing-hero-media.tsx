'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

import type { PhotoWithDetails } from '@/types'
import { getImageUrl } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

const ROTATION_INTERVAL = 7000

interface LandingHeroMediaProps {
  photos: PhotoWithDetails[]
}

export function LandingHeroMedia({ photos }: LandingHeroMediaProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const featured = useMemo(() => {
    if (!photos?.length) return []
    const unique = new Map<string, PhotoWithDetails>()
    for (const photo of photos) {
      if (!unique.has(photo.id)) {
        unique.set(photo.id, photo)
      }
      if (unique.size >= 5) break
    }
    return Array.from(unique.values())
  }, [photos])

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion || featured.length <= 1) return
    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % featured.length)
    }, ROTATION_INTERVAL)
    return () => window.clearInterval(id)
  }, [featured.length, prefersReducedMotion])

  if (featured.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-surface-canvas via-transparent to-transparent" />
      <div className="absolute inset-0">
        {featured.map((photo, index) => {
          const isActive = index === activeIndex
          const opacity = prefersReducedMotion ? (index === 0 ? 1 : 0) : isActive ? 1 : 0
          return (
            <Image
              key={photo.id}
              src={getImageUrl(photo.id, 'large', 'webp')}
              alt={photo.album?.title || photo.tags?.[0]?.tag?.name || '精选照片'}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="transition-opacity duration-[1600ms] ease-[var(--ease-soft)] object-cover"
              style={{ opacity }}
            />
          )
        })}
      </div>
    </div>
  )
}
