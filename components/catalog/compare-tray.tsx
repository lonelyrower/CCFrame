"use client"

import Image from 'next/image'
import { Layers, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Text } from '@/components/ui/typography'
import { useCompare } from './compare-provider'
import { useOptionalLightbox } from '@/components/gallery/lightbox-context'
import { getImageUrl } from '@/lib/utils'

export function CatalogCompareTray() {
  const compare = useCompare()
  const lightbox = useOptionalLightbox()

  if (compare.items.length === 0) return null

  const handleOpenLightbox = () => {
    if (!lightbox) return
    const first = compare.items[0]
    if (first) lightbox.open(first.id)
  }

  return (
    <Surface
      tone="panel"
      padding="md"
      className="flex flex-col gap-3 border border-primary/40 shadow-floating"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Layers className="h-4 w-4" />
          <span>对比托盘（{compare.items.length}/4）</span>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="清空对比" onClick={() => compare.clear()}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {compare.items.map((photo) => (
          <div key={photo.id} className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={getImageUrl(photo.id, 'thumb', 'webp')}
              alt={photo.album?.title || photo.tags[0]?.tag?.name || 'compare item'}
              fill
              sizes="64px"
              className="object-cover"
            />
            <button
              type="button"
              className="absolute inset-0 rounded-lg border-2 border-transparent focus-visible:border-primary"
              aria-label="从对比中移除"
              onClick={() => compare.remove(photo.id)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text size="xs" tone="muted">
          选择最多 4 张作品进行细节对比。
        </Text>
        <div className="flex items-center gap-2">
          {lightbox ? (
            <Button size="sm" variant="default" onClick={handleOpenLightbox}>
              打开光箱
            </Button>
          ) : null}
        </div>
      </div>
    </Surface>
  )
}
