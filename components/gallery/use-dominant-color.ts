import { useEffect, useState } from 'react'
import { getImageUrl } from '@/lib/utils'

interface ColorPalette {
  dominant: string
  accent: string
  muted: string
  background: string
  text: string
  isDark: boolean
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToString(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`
}

function generateHarmoniousPalette(dominantColor: [number, number, number]): ColorPalette {
  const [h, s, l] = dominantColor
  const isDark = l < 50

  // Create harmonious color variations
  const complementaryHue = (h + 180) % 360
  const analogousHue1 = (h + 30) % 360
  const analogousHue2 = (h - 30 + 360) % 360

  return {
    dominant: hslToString(h, Math.max(30, Math.min(s, 85)), Math.max(20, Math.min(l, 75))),
    accent: hslToString(analogousHue1, Math.max(40, s), isDark ? Math.min(l + 20, 80) : Math.max(l - 15, 25)),
    muted: hslToString(analogousHue2, Math.max(10, s * 0.6), isDark ? l + 10 : l - 10),
    background: hslToString(h, Math.max(5, s * 0.3), isDark ? 8 : 97),
    text: hslToString(h, Math.max(10, s * 0.4), isDark ? 95 : 12),
    isDark
  }
}

function analyzeImageColors(imageData: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  const colorCounts = new Map<string, number>()
  const step = 8 // Sample every 8th pixel for performance

  for (let i = 0; i < imageData.length; i += 4 * step) {
    const r = imageData[i]
    const g = imageData[i + 1]
    const b = imageData[i + 2]
    const alpha = imageData[i + 3]

    if (alpha < 128) continue // Skip transparent pixels

    // Skip very dark or very bright pixels to avoid extremes
    const brightness = (r + g + b) / 3
    if (brightness < 30 || brightness > 225) continue

    const [h, s, l] = rgbToHsl(r, g, b)

    // Skip very unsaturated colors
    if (s < 15) continue

    const key = `${Math.round(h/10)*10}-${Math.round(s/20)*20}-${Math.round(l/20)*20}`
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1)
  }

  if (colorCounts.size === 0) {
    // Fallback to simple average if no suitable colors found
    let r = 0, g = 0, b = 0, count = 0
    for (let i = 0; i < imageData.length; i += 4 * 20) {
      r += imageData[i]; g += imageData[i+1]; b += imageData[i+2]; count++
    }
    if (count > 0) {
      return rgbToHsl(r / count, g / count, b / count)
    }
    return [220, 13, 18] // Fallback to default theme
  }

  // Find the most common color
  let maxCount = 0
  let dominantColorKey = ''

  for (const [colorKey, count] of colorCounts) {
    if (count > maxCount) {
      maxCount = count
      dominantColorKey = colorKey
    }
  }

  const [h, s, l] = dominantColorKey.split('-').map(Number)
  return [h, s, l]
}

export function useDominantColor(photoId: string, enabled: boolean) {
  const [avgColor, setAvgColor] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const img: HTMLImageElement = (typeof Image !== 'undefined' ? new (Image as any)() : document.createElement('img'))
    img.src = getImageUrl(photoId, 'thumb', 'webp')
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4 * 20) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++
        }
        if (count) {
          r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count)
          if (!cancelled) setAvgColor(`rgb(${r}, ${g}, ${b})`)
        }
      } catch {/* ignore */}
    }
    return () => { cancelled = true }
  }, [photoId, enabled])
  return avgColor
}

export function useImageColorPalette(photoId: string, enabled: boolean = true) {
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !photoId) return

    let cancelled = false
    setIsLoading(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = getImageUrl(photoId, 'large', 'webp')

    img.onload = () => {
      if (cancelled) return

      try {
        const canvas = document.createElement('canvas')
        const maxSize = 400 // Limit canvas size for performance
        const aspectRatio = img.naturalWidth / img.naturalHeight

        if (aspectRatio > 1) {
          canvas.width = maxSize
          canvas.height = maxSize / aspectRatio
        } else {
          canvas.width = maxSize * aspectRatio
          canvas.height = maxSize
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const dominantColor = analyzeImageColors(imageData.data, canvas.width, canvas.height)
        const generatedPalette = generateHarmoniousPalette(dominantColor)

        if (!cancelled) {
          setPalette(generatedPalette)
          setIsLoading(false)
        }
      } catch (error) {
        console.warn('Failed to analyze image colors:', error)
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    img.onerror = () => {
      if (!cancelled) {
        setIsLoading(false)
      }
    }

    return () => {
      cancelled = true
    }
  }, [photoId, enabled])

  return { palette, isLoading }
}