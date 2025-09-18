"use client"
import { useEffect } from 'react'
import { getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

export function usePrefetchPhotos(list: PhotoWithDetails[], index: number) {
  useEffect(() => {
    const targets: number[] = []
    if (index + 1 < list.length) targets.push(index + 1)
    if (index - 1 >= 0) targets.push(index - 1)
    targets.forEach(i => {
      const p = list[i]
      const url = getImageUrl(p.id, 'large', 'webp')
      const img = new Image()
      img.src = url
    })
  }, [list, index])
}
