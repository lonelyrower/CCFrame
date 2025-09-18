import { useEffect, useState } from 'react'
import { getImageUrl } from '@/lib/utils'

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